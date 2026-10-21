// import { useState, useEffect, useRef } from 'react'
// import { FileText, Upload, X, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
// import { useAuth } from '../../hooks/useAuth'
// import { supabase } from '../../lib/supabase'
// import { extractDocument } from '../../lib/api'
// import { DashboardLayout } from '../../components/layout/TopBar'
// import { Card } from '../../components/ui/Card'
// import { Button } from '../../components/ui/Button'
// import { Modal } from '../../components/ui/Modal'
// import { Select } from '../../components/ui/Input'
// import { Spinner } from '../../components/ui/Spinner'
// import { statusBadge } from '../../components/ui/Badge'
// import type { MedicalDocument, DocumentType } from '../../types'
// import toast from 'react-hot-toast'

// const DOC_TYPES: { value: DocumentType; label: string }[] = [
//   { value: 'lab_report', label: 'Lab Report' },
//   { value: 'prescription', label: 'Prescription' },
//   { value: 'imaging', label: 'Imaging / Scan' },
//   { value: 'discharge_summary', label: 'Discharge Summary' },
//   { value: 'vaccination', label: 'Vaccination Record' },
//   { value: 'insurance', label: 'Insurance Document' },
//   { value: 'other', label: 'Other' },
// ]

// const statusIcon = (s: string) => {
//   if (s === 'PROCESSED') return <CheckCircle2 size={14} className="text-emerald-400" />
//   if (s === 'FAILED') return <AlertCircle size={14} className="text-rose-400" />
//   if (s === 'PROCESSING') return <Loader2 size={14} className="text-cyan-400 animate-spin" />
//   return <Clock size={14} className="text-amber-400" />
// }

// const fmt = (bytes: number) => {
//   if (bytes < 1024) return `${bytes} B`
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
//   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
// }

// export default function PatientDocuments() {
//   const { profile } = useAuth()
//   const [docs, setDocs] = useState<MedicalDocument[]>([])
//   const [loading, setLoading] = useState(true)
//   const [uploadOpen, setUploadOpen] = useState(false)
//   const [file, setFile] = useState<File | null>(null)
//   const [docType, setDocType] = useState<DocumentType>('lab_report')
//   const [uploading, setUploading] = useState(false)
//   const fileRef = useRef<HTMLInputElement>(null)

//   const load = async () => {
//     if (!profile) return
//     const { data } = await supabase
//       .from('medical_documents')
//       .select('*')
//       .eq('patient_id', profile.id)
//       .order('created_at', { ascending: false })
//     setDocs(data ?? [])
//     setLoading(false)
//   }

//   useEffect(() => { load() }, [profile])

//   const handleUpload = async () => {
//     if (!file || !profile) return
//     setUploading(true)

//     try {
//       const ext = file.name.split('.').pop()
//       const filePath = `${profile.id}/${Date.now()}.${ext}`

//       // 1. Upload to Supabase Storage
//       const { error: storageError } = await supabase.storage
//         .from('medical-documents')
//         .upload(filePath, file, { contentType: file.type })
//       if (storageError) throw storageError

//       // 2. Insert document record
//       const { data: doc, error: dbError } = await supabase
//         .from('medical_documents')
//         .insert({
//           patient_id: profile.id,
//           document_name: file.name,
//           document_type: docType,
//           file_path: filePath,
//           file_size: file.size,
//           mime_type: file.type,
//           processing_status: 'PENDING',
//           upload_date: new Date().toISOString(),
//         })
//         .select()
//         .single()
//       if (dbError) throw dbError

//       toast.success('Document uploaded! Processing...')
//       setUploadOpen(false)
//       setFile(null)
//       load()

//       // 3. Get signed URL and call AI extraction (non-blocking)
//       const { data: signedData } = await supabase.storage
//         .from('medical-documents')
//         .createSignedUrl(filePath, 3600)

//       if (signedData?.signedUrl) {
//         extractDocument({
//           signed_url: signedData.signedUrl,
//           doc_type: docType,
//           document_id: doc.id,
//           patient_id: profile.id,
//         }).catch(() => {
//           // Backend might not be running — silent failure
//         })

//         // Poll for status updates
//         const pollInterval = setInterval(async () => {
//           const { data: pollData } = await supabase
//             .from('medical_documents')
//             .select('processing_status')
//             .eq('id', doc.id)
//             .single()

//           if (pollData) {
//             if (pollData.processing_status === 'PROCESSED') {
//               clearInterval(pollInterval)
//               toast.success('✅ Document processed successfully')
//               load()
//             } else if (pollData.processing_status === 'FAILED') {
//               clearInterval(pollInterval)
//               toast.error('❌ Document processing failed. Please try again.')
//               load()
//             }
//           }
//         }, 3000)
//       }
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : 'Upload failed')
//     } finally {
//       setUploading(false)
//     }
//   }

//   const handleDelete = async (doc: MedicalDocument) => {
//     if (!confirm(`Delete "${doc.document_name}"?`)) return
//     await supabase.storage.from('medical-documents').remove([doc.file_path])
//     await supabase.from('medical_documents').delete().eq('id', doc.id)
//     toast.success('Document deleted')
//     load()
//   }

//   return (
//     <DashboardLayout
//       title="My Documents"
//       subtitle={`${docs.length} document${docs.length !== 1 ? 's' : ''} stored`}
//       actions={
//         <Button
//           variant="primary"
//           size="sm"
//           icon={<Upload size={16} />}
//           onClick={() => setUploadOpen(true)}
//         >
//           Upload Document
//         </Button>
//       }
//     >
//       {loading ? (
//         <div className="flex justify-center py-20"><Spinner size="lg" /></div>
//       ) : docs.length === 0 ? (
//         <Card className="text-center py-20">
//           <FileText size={48} className="text-slate-600 mx-auto mb-4" />
//           <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
//           <p className="text-slate-400 mb-6">Upload your first medical document to get started</p>
//           <Button onClick={() => setUploadOpen(true)} icon={<Upload size={16} />}>
//             Upload Document
//           </Button>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {docs.map(doc => (
//             <Card key={doc.id} hover>
//               <div className="flex items-start justify-between mb-3">
//                 <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
//                   <FileText size={18} className="text-cyan-400" />
//                 </div>
//                 <button
//                   onClick={() => handleDelete(doc)}
//                   className="text-slate-500 hover:text-rose-400 transition-colors p-1"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//               <p className="text-sm font-semibold text-white mb-1 leading-tight">{doc.document_name}</p>
//               <p className="text-xs text-slate-500 capitalize mb-3">{doc.document_type.replace('_', ' ')}</p>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-1.5">
//                   {statusIcon(doc.processing_status)}
//                   {statusBadge(doc.processing_status)}
//                 </div>
//                 <span className="text-xs text-slate-600">
//                   {doc.file_size ? fmt(doc.file_size) : ''}
//                 </span>
//               </div>
//               <p className="text-xs text-slate-600 mt-2">
//                 {new Date(doc.upload_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//               </p>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Upload Modal */}
//       <Modal
//         isOpen={uploadOpen}
//         onClose={() => { setUploadOpen(false); setFile(null) }}
//         title="Upload Medical Document"
//         size="md"
//       >
//         <div className="space-y-4">
//           <Select
//             label="Document Type"
//             value={docType}
//             onChange={e => setDocType(e.target.value as DocumentType)}
//             options={DOC_TYPES}
//           />

//           {/* Drop zone */}
//           <div
//             onClick={() => fileRef.current?.click()}
//             className={[
//               'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
//               file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700 hover:border-cyan-500/40 hover:bg-white/2',
//             ].join(' ')}
//           >
//             <input
//               ref={fileRef}
//               type="file"
//               accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
//               className="hidden"
//               onChange={e => setFile(e.target.files?.[0] ?? null)}
//             />
//             {file ? (
//               <div>
//                 <CheckCircle2 size={32} className="text-cyan-400 mx-auto mb-2" />
//                 <p className="text-sm text-white font-medium">{file.name}</p>
//                 <p className="text-xs text-slate-500">{fmt(file.size)}</p>
//               </div>
//             ) : (
//               <div>
//                 <Upload size={32} className="text-slate-500 mx-auto mb-2" />
//                 <p className="text-sm text-slate-300">Click to select a file</p>
//                 <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 20MB</p>
//               </div>
//             )}
//           </div>

//           <div className="flex gap-3 pt-2">
//             <Button variant="ghost" fullWidth onClick={() => { setUploadOpen(false); setFile(null) }}>
//               Cancel
//             </Button>
//             <Button fullWidth loading={uploading} disabled={!file} onClick={handleUpload} icon={<Upload size={16} />}>
//               Upload & Process
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </DashboardLayout>
//   )
// }
import { useState, useEffect, useRef } from 'react'
import { FileText, Upload, X, CheckCircle2, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { extractDocument } from '../../lib/api'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import type { MedicalDocument, DocumentType } from '../../types'
import toast from 'react-hot-toast'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'imaging', label: 'Imaging / Scan' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'insurance', label: 'Insurance Document' },
  { value: 'other', label: 'Other' },
]

const fmt = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}



export default function PatientDocuments() {
  const { profile } = useAuth()
  const [docs, setDocs] = useState<MedicalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType>('lab_report')
  const [uploading, setUploading] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  const handleUpload = async () => {
    if (!file || !profile) return
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const filePath = `${profile.id}/${Date.now()}.${ext}`

      // 1. Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, file, { contentType: file.type })
      if (storageError) throw storageError

      // 2. Insert document record
      const { data: doc, error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          patient_id: profile.id,
          document_name: file.name,
          document_type: docType,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          processing_status: 'PENDING',
          upload_date: new Date().toISOString(),
        })
        .select()
        .single()
      if (dbError) throw dbError

      toast.success('Document uploaded successfully!')
      setUploadOpen(false)
      setFile(null)
      load()

      // 3. Get signed URL and call AI extraction (non-blocking, silent)
      const { data: signedData } = await supabase.storage
        .from('medical-documents')
        .createSignedUrl(filePath, 3600)

      if (signedData?.signedUrl) {
        extractDocument({
          signed_url: signedData.signedUrl,
          doc_type: docType,
          document_id: doc.id,
          patient_id: profile.id,
        }).catch(() => {
          // Backend might not be running — silent failure
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleView = async (doc: MedicalDocument) => {
    setViewingId(doc.id)
    try {
      const { data, error } = await supabase.storage
        .from('medical-documents')
        .createSignedUrl(doc.file_path, 3600)

      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      toast.error('Could not open document')
      console.error(err)
    } finally {
      setViewingId(null)
    }
  }

  const handleDelete = async (doc: MedicalDocument) => {
    if (!confirm(`Delete "${doc.document_name}"?`)) return
    await supabase.storage.from('medical-documents').remove([doc.file_path])
    await supabase.from('medical_documents').delete().eq('id', doc.id)
    toast.success('Document deleted')
    load()
  }

  return (
    <DashboardLayout
      title="My Documents"
      subtitle={`${docs.length} document${docs.length !== 1 ? 's' : ''} stored`}
      actions={
        <Button
          variant="primary"
          size="sm"
          icon={<Upload size={16} />}
          onClick={() => setUploadOpen(true)}
        >
          Upload Document
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <Card className="text-center py-20">
          <FileText size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
          <p className="text-slate-400 mb-6">Upload your first medical document to get started</p>
          <Button onClick={() => setUploadOpen(true)} icon={<Upload size={16} />}>
            Upload Document
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <Card
              key={doc.id}
              hover
              className="cursor-pointer group relative"
              onClick={() => handleView(doc)}
            >
              {viewingId === doc.id && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                  <Spinner size="sm" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/25 transition-colors">
                  <FileText size={18} className="text-cyan-400" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(doc)
                  }}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm font-semibold text-white mb-1 leading-tight group-hover:text-cyan-400 transition-colors">
                {doc.document_name}
              </p>
              <p className="text-xs text-slate-500 capitalize mb-3">
                {doc.document_type.replace('_', ' ')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {doc.file_size ? fmt(doc.file_size) : ''}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {new Date(doc.upload_date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => { setUploadOpen(false); setFile(null) }}
        title="Upload Medical Document"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Document Type"
            value={docType}
            onChange={e => setDocType(e.target.value as DocumentType)}
            options={DOC_TYPES}
          />

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className={[
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
              file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700 hover:border-cyan-500/40 hover:bg-white/2',
            ].join(' ')}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <CheckCircle2 size={32} className="text-cyan-400 mx-auto mb-2" />
                <p className="text-sm text-white font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">{fmt(file.size)}</p>
              </div>
            ) : (
              <div>
                <Upload size={32} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Click to select a file</p>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 20MB</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => { setUploadOpen(false); setFile(null) }}>
              Cancel
            </Button>
            <Button fullWidth loading={uploading} disabled={!file} onClick={handleUpload} icon={<Upload size={16} />}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}