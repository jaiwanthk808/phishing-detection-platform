import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp']
const MAX_MB = 5

interface Props {
  file: File | null
  onFile: (file: File | null) => void
  label: string
}

/** Drag-and-drop or click-to-select image upload with client-side validation and preview. */
export default function FileDropzone({ file, onFile, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function accept(f: File | undefined) {
    if (!f) return
    if (!ACCEPT.includes(f.type)) {
      setError('Unsupported file type. Use PNG, JPG, JPEG, or WebP.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is larger than ${MAX_MB} MB.`)
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(f))
    onFile(f)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    accept(e.dataTransfer.files[0])
  }

  function clear() {
    setPreview(null)
    setError(null)
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        role="button"
        tabIndex={0}
        aria-label={label}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          over ? 'border-accent bg-accent/5' : 'border-[var(--color-border)] hover:border-accent-2'}`}
      >
        {preview ? (
          <img src={preview} alt="Selected upload preview" className="max-h-60 max-w-full rounded-lg object-contain" />
        ) : (
          <>
            <UploadCloud className="text-accent" size={32} aria-hidden="true" />
            <p className="text-sm">Drag and drop an image here, or click to choose a file</p>
            <p className="text-xs text-muted">PNG, JPG, JPEG, or WebP · up to {MAX_MB} MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          className="hidden"
          onChange={e => accept(e.target.files?.[0])}
        />
      </div>
      {file && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span className="truncate">{file.name}</span>
          <button onClick={clear} className="text-accent hover:underline">Remove</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
