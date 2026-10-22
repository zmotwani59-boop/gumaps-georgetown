// Applies a single GUMAPS website update submitted by a current GitHub collaborator.
// The only input is GitHub's event JSON; never interpolate issue text into a shell command.
const fs = require("node:fs");
const path = "gumaps/site-content.json";
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const issue = event.issue;
const association = issue?.author_association;
const allowedAuthors = new Set(["OWNER", "COLLABORATOR"]);
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const fields = {
  events: ["id","date","title","description","link","linkText"],
  volunteer: ["id","date","title","category","timeLocation","status","availability","link","linkText"],
  board: ["id","name","role","description","image"],
  labs: ["id","name","investigator","status","availability","topics","description","contact","contactLink"]
};
async function api(endpoint, options={}) {
  const response = await fetch("https://api.github.com/" + endpoint, {
    ...options,
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    }
  });
  const body = await response.text();
  const result = body ? JSON.parse(body) : {};
  if (!response.ok) {
    const error = new Error("GitHub " + response.status + ": " + (result.message || "API error"));
    error.status = response.status; throw error;
  }
  return result;
}
function validate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw Error("Invalid payload");
  const {collection,action,item} = payload;
  if (!fields[collection] || !["upsert","delete"].includes(action)) throw Error("Unknown collection or action");
  if (!item || typeof item !== "object" || Array.isArray(item)) throw Error("Invalid item");
  if (!/^[a-z0-9][a-z0-9_-]{1,99}$/i.test(item.id || "")) throw Error("Invalid item ID");
  if (action === "delete") return {collection,action,item:{id:item.id}};
  if (Object.keys(item).some(k => !fields[collection].includes(k))) throw Error("Unexpected field");
  const clean={};
  for (const f of fields[collection]) {
    const value = item[f] ?? "";
    if (typeof value !== "string" || value.length > (f === "description" ? 2000 : 700)) throw Error("Invalid field: " + f);
    clean[f] = value.trim();
  }
  if (!clean.title && ["events","volunteer"].includes(collection)) throw Error("Title is required");
  if (!clean.name && ["board","labs"].includes(collection)) throw Error("Name is required");
  if (collection === "labs" && !["yes","possible","no"].includes(clean.status)) throw Error("Invalid lab availability");
  for(const f of ["link","contactLink","image"]) {
    if (!clean[f]) continue;
    if (!/^(https?:\/\/|mailto:)/i.test(clean[f]) &&
        !/^(?!\/|\\|#|[a-z]+:)[a-z0-9][a-z0-9/_\-\.?#=&%]*$/i.test(clean[f])) {
      throw Error("Unsafe link in " + f);
    }
    if (clean[f].includes("..")) throw Error("Unsafe link path");
  }
  return {collection,action,item:clean};
}
async function main(){
  if (!issue || !allowedAuthors.has(association)) {
    console.log("Ignored issue from an account without repository collaborator status.");
    return;
  }
  const body = String(issue.body || "");
  const match = body.match(/<!-- GUMAPS_EDITOR_V1 -->\s*```json\s*([\s\S]*?)\s*```/);
  if (!match) { console.log("Not a website editor submission."); return; }
  if (match[1].length > 12000) throw Error("Submission too large");
  const update = validate(JSON.parse(match[1]));
  if (!token || !repository) throw Error("GitHub action missing token/repository");
  const endpoint = "repos/" + repository + "/contents/" + path;
  let updated = false;
  for(let attempt=1;attempt<=5;attempt++){
    const original = await api(endpoint + "?ref=main");
    const data = JSON.parse(Buffer.from(original.content.replace(/\n/g,""),"base64").toString("utf8"));
    if (data.version !== 1 || !Array.isArray(data[update.collection])) throw Error("Unsupported content");
    const arr=data[update.collection];
    const index=arr.findIndex(x=>x.id === update.item.id);
    if (update.action==="delete") {
      if(index<0) throw Error("Item no longer exists");
      arr.splice(index,1);
    } else if (index >= 0) arr[index] = update.item;
    else arr.push(update.item);
    data.updated = new Date().toISOString().slice(0,10);
    const content=Buffer.from(JSON.stringify(data,null,2)+"\n","utf8").toString("base64");
    try {
      await api(endpoint, {method:"PUT",body:JSON.stringify({
        message:"GUMAPS website: " + update.action + " " + update.collection + " via issue #" + issue.number,
        content, sha:original.sha, branch:"main"
      })});
      updated=true;
      break;
    } catch(e) {
      if(e.status!==409 || attempt===5) throw e;
      await new Promise(r=>setTimeout(r,600*attempt));
    }
  }
  if(!updated) throw Error("Could not save website change");
  await api("repos/"+repository+"/issues/"+issue.number+"/comments",{
    method:"POST",body:JSON.stringify({body:"✅ Published to the GUMAPS website source. The public site will update after the hosting deployment completes."})
  });
  await api("repos/"+repository+"/issues/"+issue.number,{
    method:"PATCH",body:JSON.stringify({state:"closed"})
  });
  console.log("Applied "+update.action+" "+update.collection+" for issue "+issue.number);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
