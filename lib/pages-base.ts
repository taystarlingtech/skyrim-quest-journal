export function pagesBasePath(env: { pages?: string; repository?: string }): string {
  if (env.pages !== "true") return ""
  const repository = env.repository?.split("/")[1]?.trim() ?? ""
  if (!repository || repository.endsWith(".github.io")) return ""
  return `/${repository}`
}
