import { parseProse } from "@/lib/text"

export function Prose({ text, className }: { text: string; className?: string }) {
  const segments = parseProse(text)
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "break") return <br key={index} />
        if (segment.type === "bold") return <strong key={index}>{segment.text}</strong>
        if (segment.type === "italic") return <em key={index}>{segment.text}</em>
        if (segment.type === "link") {
          return (
            <a key={index} href={segment.href} target="_blank" rel="noopener noreferrer">
              {segment.text}
            </a>
          )
        }
        return <span key={index}>{segment.text}</span>
      })}
    </span>
  )
}
