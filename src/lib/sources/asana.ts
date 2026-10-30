import "server-only";
import { env } from "@/lib/env";
import { AsanaTaskPayload } from "@/lib/domain/asana";

const API = "https://app.asana.com/api/1.0";

export const TASK_FIELDS = [
  "name",
  "parent.gid",
  "completed",
  "completed_at",
  "created_at",
  "modified_at",
  "memberships.project.gid",
  "memberships.section.name",
  "custom_fields.gid",
  "custom_fields.number_value",
  "custom_fields.text_value",
  "custom_fields.enum_value.name",
  "custom_fields.date_value.date",
].join(",");

const STORY_FIELDS = [
  "created_at",
  "resource_subtype",
  "custom_field.name",
  "old_enum_value.name",
  "new_enum_value.name",
  "old_number_value",
  "new_number_value",
  "old_text_value",
  "new_text_value",
  "old_section.name",
  "new_section.name",
].join(",");

/** Only GET requests: the integration is read-only. Retries on rate limit (429). */
async function get<T>(path: string): Promise<{ data: T; next_page?: { offset: string } | null }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.asanaToken()}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get("Retry-After") ?? "5");
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Asana ${res.status} em ${path.split("?")[0]}: ${await res.text()}`);
    return res.json();
  }
  throw new Error("Asana: limite de requisições excedido repetidamente");
}

export async function readProjectTasks(): Promise<AsanaTaskPayload[]> {
  const tasks: AsanaTaskPayload[] = [];
  let offset: string | undefined;
  do {
    const query = new URLSearchParams({ project: env.asanaProjectGid(), limit: "100", opt_fields: TASK_FIELDS });
    if (offset) query.set("offset", offset);
    const page = await get<AsanaTaskPayload[]>(`/tasks?${query}`);
    tasks.push(...page.data);
    offset = page.next_page?.offset;
  } while (offset);
  return tasks;
}

export interface AsanaStory {
  gid: string;
  created_at: string;
  resource_subtype: string;
  custom_field?: { name: string } | null;
  old_enum_value?: { name: string } | null;
  new_enum_value?: { name: string } | null;
  old_number_value?: number | null;
  new_number_value?: number | null;
  old_text_value?: string | null;
  new_text_value?: string | null;
  old_section?: { name: string } | null;
  new_section?: { name: string } | null;
}

const RELEVANT_STORIES = new Set([
  "section_changed",
  "enum_custom_field_changed",
  "number_custom_field_changed",
  "text_custom_field_changed",
  "date_custom_field_changed",
  "marked_complete",
  "marked_incomplete",
]);

/** Change history of one task, limited to status, section, value, NF and date changes. */
export async function readTaskStories(taskGid: string): Promise<AsanaStory[]> {
  const stories: AsanaStory[] = [];
  let offset: string | undefined;
  do {
    const query = new URLSearchParams({ limit: "100", opt_fields: STORY_FIELDS });
    if (offset) query.set("offset", offset);
    const page = await get<AsanaStory[]>(`/tasks/${taskGid}/stories?${query}`);
    stories.push(...page.data.filter((s) => RELEVANT_STORIES.has(s.resource_subtype)));
    offset = page.next_page?.offset;
  } while (offset);
  return stories;
}
