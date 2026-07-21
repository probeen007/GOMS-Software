interface SectionLabelProps {
  text: string
  center?: boolean
  light?: boolean
}

export default function SectionLabel({ text, center = false, light = false }: SectionLabelProps) {
  return (
    <div
      className={`section-label ${center ? 'text-center block' : ''}`}
      style={{ color: light ? 'rgba(230,57,70,0.9)' : '#E63946' }}
    >
      {text}
    </div>
  )
}
