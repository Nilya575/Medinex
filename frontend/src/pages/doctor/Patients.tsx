// import { useState, useEffect } from 'react'
// import { Users, Brain, Pill, ClipboardList, RefreshCw, Plus, Trash2, Save, FileText, Eye, Download, ZoomIn, ZoomOut, RotateCw, AlertCircle, X, Loader2, Clock, CheckCircle2 } from 'lucide-react'
// import { useAuth } from '../../hooks/useAuth'
// import { supabase } from '../../lib/supabase'
// import { generateSummary } from '../../lib/api'
// import { DashboardLayout } from '../../components/layout/TopBar'
// import { Card } from '../../components/ui/Card'
// import { Button } from '../../components/ui/Button'
// import { Input, Textarea } from '../../components/ui/Input'
// import { Spinner } from '../../components/ui/Spinner'
// import { Badge } from '../../components/ui/Badge'
// import type { Connection, MasterSummary, Medication, MedicalDocument } from '../../types'
// import toast from 'react-hot-toast'

// type Tab = 'summary' | 'medications' | 'documents' | 'prescribe'

// const EMPTY_MED: Medication = { drug_name: '', strength: '', dosage: '', frequency: '', duration: '', instructions: '' }

// function MarkdownSummary({ text }: { text: string }) {
//   const lines = text.split('\n')
//   return (
//     <div className="space-y-1">
//       {lines.map((line, i) => {
//         if (line.startsWith('## ')) {
//           return <h3 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.replace('## ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</h3>
//         }
//         if (line.startsWith('**') && line.endsWith('**')) {
//           return <p key={i} className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
//         }
//         if (line.startsWith('• ') || line.startsWith('- ')) {
//           return (
//             <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
//               <span className="text-cyan-400 mt-0.5 flex-shrink-0">•</span>
//               <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</span>
//             </div>
//           )
//         }
//         if (line.trim() === '') return <div key={i} className="h-1" />
//         return <p key={i} className="text-sm text-slate-400">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
//       })}
//     </div>
//   )
// }

// const DOC_TYPE_COLORS: Record<string, string> = {
//   lab_report: 'text-cyan-400 bg-cyan-500/15',
//   prescription: 'text-purple-400 bg-purple-500/15',
//   imaging: 'text-blue-400 bg-blue-500/15',
//   discharge_summary: 'text-amber-400 bg-amber-500/15',
//   vaccination: 'text-green-400 bg-green-500/15',
//   insurance: 'text-rose-400 bg-rose-500/15',
//   other: 'text-slate-400 bg-slate-500/15',
// }

// const fmt = (bytes: number) => {
//   if (!bytes) return ''
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
//   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
// }

// const DocStatusBadge = ({ status }: { status: string }) => {
//   if (status === 'PROCESSED') return (
//     <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
//       <CheckCircle2 size={10} /> Processed
//     </span>
//   )
//   if (status === 'FAILED') return (
//     <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
//       <AlertCircle size={10} /> Failed
//     </span>
//   )
//   if (status === 'PROCESSING') return (
//     <span className="flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
//       <Loader2 size={10} className="animate-spin" /> Processing
//     </span>
//   )
//   return (
//     <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
//       <Clock size={10} /> Pending
//     </span>
//   )
// }

// // ── Document Viewer Overlay ──────────────────────────────────────────────────
// function DocViewer({ doc, onClose }: { doc: MedicalDocument; onClose: () => void }) {
//   const [signedUrl, setSignedUrl] = useState<string | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [zoom, setZoom] = useState(1)
//   const [rotation, setRotation] = useState(0)
//   const [imgError, setImgError] = useState(false)

//   const isPdf = doc.mime_type === 'application/pdf' || doc.file_path?.endsWith('.pdf')

//   useEffect(() => {
//     setLoading(true)
//     setSignedUrl(null)
//     setZoom(1)
//     setRotation(0)
//     setImgError(false)
//     supabase.storage
//       .from('medical-documents')
//       .createSignedUrl(doc.file_path, 3600)
//       .then(({ data }) => {
//         setSignedUrl(data?.signedUrl ?? null)
//         setLoading(false)
//       })
//   }, [doc.id])

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: 'rgba(3,7,18,0.88)', backdropFilter: 'blur(14px)' }}
//       onClick={onClose}
//     >
//       <div
//         className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
//         style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(6,182,212,0.15)' }}
//         onClick={e => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 flex-shrink-0">
//           <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${DOC_TYPE_COLORS[doc.document_type] ?? DOC_TYPE_COLORS.other}`}>
//             <FileText size={16} />
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-semibold text-white truncate">{doc.document_name}</p>
//             <p className="text-xs text-slate-400 capitalize">
//               {doc.document_type?.replace(/_/g, ' ')} · {fmt(doc.file_size ?? 0)}
//             </p>
//           </div>

//           {!isPdf && signedUrl && !imgError && (
//             <div className="flex items-center gap-1 mr-2">
//               <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"><ZoomOut size={15} /></button>
//               <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
//               <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"><ZoomIn size={15} /></button>
//               <button onClick={() => setRotation(r => (r + 90) % 360)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all ml-1"><RotateCw size={15} /></button>
//             </div>
//           )}

//           {signedUrl && (
//             <a href={signedUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Download">
//               <Download size={15} />
//             </a>
//           )}
//           <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
//             <X size={16} />
//           </button>
//         </div>

//         {/* Viewer body */}
//         <div className="flex-1 overflow-auto flex items-start justify-center p-4 min-h-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
//           {loading ? (
//             <div className="flex flex-col items-center justify-center py-20 gap-3"><Spinner /><p className="text-sm text-slate-400">Loading document...</p></div>
//           ) : !signedUrl ? (
//             <div className="flex flex-col items-center justify-center py-20 gap-3"><AlertCircle size={36} className="text-rose-400" /><p className="text-sm text-slate-400">Could not load document</p></div>
//           ) : isPdf ? (
//             <iframe src={`${signedUrl}#toolbar=1`} className="w-full rounded-xl" style={{ height: 'calc(90vh - 130px)', border: 'none' }} title={doc.document_name} />
//           ) : imgError ? (
//             <div className="flex flex-col items-center justify-center py-20 gap-3">
//               <AlertCircle size={36} className="text-rose-400" />
//               <p className="text-sm text-slate-400">Could not render image</p>
//               <a href={signedUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">Open in new tab</a>
//             </div>
//           ) : (
//             <img
//               src={signedUrl}
//               alt={doc.document_name}
//               onError={() => setImgError(true)}
//               style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'top center', transition: 'transform 0.2s ease', maxWidth: '100%', borderRadius: '8px', display: 'block' }}
//             />
//           )}
//         </div>

//         {/* AI summary strip */}
//         {doc.processing_status === 'PROCESSED' && doc.extracted_data && (
//           <div className="px-5 py-3 border-t border-white/5 flex-shrink-0" style={{ background: 'rgba(6,182,212,0.04)' }}>
//             <p className="text-xs text-slate-500 mb-1">AI Summary</p>
//             <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{(doc.extracted_data as any)?.summary ?? 'No summary available'}</p>
//             {(doc.extracted_data as any)?.diagnosis?.length > 0 && (
//               <div className="flex flex-wrap gap-1.5 mt-2">
//                 {((doc.extracted_data as any).diagnosis as string[]).slice(0, 4).map((d: string) => (
//                   <span key={d} className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">{d}</span>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // ── Main component ────────────────────────────────────────────────────────────
// export default function DoctorPatients() {
//   const { profile, doctorProfile } = useAuth()
//   const [patients, setPatients] = useState<Connection[]>([])
//   const [selectedPatient, setSelectedPatient] = useState<Connection | null>(null)
//   const [tab, setTab] = useState<Tab>('summary')
//   const [loading, setLoading] = useState(true)

//   const [summary, setSummary] = useState<MasterSummary | null>(null)
//   const [summaryLoading, setSummaryLoading] = useState(false)
//   const [summaryGenerating, setSummaryGenerating] = useState(false)
//   const [activeMeds, setActiveMeds] = useState<Medication[]>([])
//   const [medsLoading, setMedsLoading] = useState(false)
//   const [patientProfile, setPatientProfile] = useState<any>(null)

//   // Documents tab
//   const [patientDocs, setPatientDocs] = useState<MedicalDocument[]>([])
//   const [docsLoading, setDocsLoading] = useState(false)
//   const [viewingDoc, setViewingDoc] = useState<MedicalDocument | null>(null)

//   // Prescription form
//   const [rxForm, setRxForm] = useState({ diagnosis: '', notes: '', follow_up_date: '' })
//   const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }])
//   const [rxSaving, setRxSaving] = useState(false)

//   useEffect(() => {
//     if (!profile) return
//     supabase
//       .from('connections')
//       .select('*, patient:profiles!patient_id(full_name, email, city, patient_profiles(date_of_birth, blood_group, gender, height_cm, weight_kg))')
//       .eq('doctor_id', profile.id)
//       .eq('status', 'ACTIVE')
//       .then(({ data }) => { setPatients(data ?? []); setLoading(false) })
//   }, [profile])

//   const selectPatient = async (conn: Connection) => {
//     setSelectedPatient(conn)
//     setTab('summary')
//     setSummary(null)
//     setPatientProfile(null)
//     setPatientDocs([])
//     loadSummary(conn)
//     const { data: pp } = await supabase.from('patient_profiles').select('*').eq('profile_id', conn.patient_id).single()
//     setPatientProfile(pp)
//   }

//   const loadSummary = async (conn: Connection) => {
//     setSummaryLoading(true)
//     const { data } = await supabase
//       .from('master_summaries')
//       .select('*')
//       .eq('patient_id', conn.patient_id)
//       .eq('doctor_id', profile!.id)
//       .order('generated_at', { ascending: false })
//       .limit(1)
//       .single()
//     setSummary(data ?? null)
//     setSummaryLoading(false)
//   }

//   const handleGenerateSummary = async () => {
//     if (!selectedPatient || !profile || !doctorProfile) return
//     setSummaryGenerating(true)
//     try {
//       await generateSummary({ patient_id: selectedPatient.patient_id, doctor_id: profile.id, doctor_specialty: doctorProfile.specialization })
//       await loadSummary(selectedPatient)
//       toast.success('Summary generated!')
//     } catch {
//       toast.error('Backend not running. Start the FastAPI server.')
//     } finally {
//       setSummaryGenerating(false)
//     }
//   }

//   const loadActiveMeds = async (conn: Connection) => {
//     setMedsLoading(true)
//     const { data: rxs } = await supabase.from('prescriptions').select('medications').eq('patient_id', conn.patient_id).eq('is_active', true)
//     setActiveMeds((rxs ?? []).flatMap(r => (r.medications as Medication[]) ?? []))
//     setMedsLoading(false)
//   }

//   const loadPatientDocs = async (conn: Connection) => {
//     setDocsLoading(true)
//     const { data } = await supabase
//       .from('medical_documents')
//       .select('*')
//       .eq('patient_id', conn.patient_id)
//       .order('upload_date', { ascending: false })
//     setPatientDocs(data ?? [])
//     setDocsLoading(false)
//   }

//   useEffect(() => {
//     if (!selectedPatient) return
//     if (tab === 'medications') loadActiveMeds(selectedPatient)
//     if (tab === 'documents') loadPatientDocs(selectedPatient)
//   }, [tab, selectedPatient])

//   const addMedRow = () => setMedications(prev => [...prev, { ...EMPTY_MED }])
//   const removeMedRow = (i: number) => setMedications(prev => prev.filter((_, idx) => idx !== i))
//   const setMed = (i: number, field: keyof Medication, val: string) =>
//     setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

//   const handleSaveRx = async () => {
//     if (!selectedPatient || !profile) return
//     if (!rxForm.diagnosis) { toast.error('Diagnosis is required'); return }
//     const validMeds = medications.filter(m => m.drug_name)
//     if (validMeds.length === 0) { toast.error('Add at least one medication'); return }
//     setRxSaving(true)
//     try {
//       const { error } = await supabase.from('prescriptions').insert({
//         patient_id: selectedPatient.patient_id,
//         doctor_id: profile.id,
//         diagnosis: rxForm.diagnosis,
//         medications: validMeds,
//         notes: rxForm.notes || null,
//         follow_up_date: rxForm.follow_up_date || null,
//         is_active: true,
//         version: 1,
//       })
//       if (error) throw error
//       toast.success('Prescription saved!')
//       setRxForm({ diagnosis: '', notes: '', follow_up_date: '' })
//       setMedications([{ ...EMPTY_MED }])
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : 'Failed to save')
//     } finally {
//       setRxSaving(false)
//     }
//   }

//   const getPatientAge = (conn: Connection) => {
//     const dob = (conn.patient as any)?.patient_profiles?.[0]?.date_of_birth
//     if (!dob) return null
//     return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
//   }

//   const TABS = [
//     { key: 'summary' as const, label: 'AI Summary', icon: <Brain size={15} /> },
//     { key: 'medications' as const, label: 'Active Medications', icon: <Pill size={15} /> },
//     { key: 'documents' as const, label: 'Documents', icon: <FileText size={15} />, count: patientDocs.length },
//     { key: 'prescribe' as const, label: 'Write Prescription', icon: <ClipboardList size={15} /> },
//   ]

//   return (
//     <DashboardLayout title="My Patients" subtitle={`${patients.length} active patient${patients.length !== 1 ? 's' : ''}`}>
//       <div className="flex gap-4 h-full">

//         {/* Left: Patient List */}
//         <div className="w-64 flex-shrink-0">
//           <Card className="p-0 overflow-hidden">
//             <div className="p-3 border-b border-cyan-500/10">
//               <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
//                 <Users size={16} className="text-cyan-400" />
//                 Patients ({patients.length})
//               </div>
//             </div>
//             {loading ? (
//               <div className="flex justify-center py-8"><Spinner /></div>
//             ) : patients.length === 0 ? (
//               <div className="text-center py-8 px-4">
//                 <Users size={28} className="text-slate-600 mx-auto mb-2" />
//                 <p className="text-slate-400 text-sm">No active patients</p>
//               </div>
//             ) : (
//               <div className="overflow-y-auto max-h-[70vh]">
//                 {patients.map(conn => {
//                   const patient = conn.patient as any
//                   const age = getPatientAge(conn)
//                   const isSelected = selectedPatient?.id === conn.id
//                   return (
//                     <button
//                       key={conn.id}
//                       onClick={() => selectPatient(conn)}
//                       className={['w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200', isSelected ? 'bg-cyan-500/15 border-l-2 border-cyan-500' : 'hover:bg-white/3 border-l-2 border-transparent'].join(' ')}
//                     >
//                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${isSelected ? 'bg-gradient-to-br from-cyan-500 to-teal-500' : 'bg-slate-700'}`}>
//                         {patient?.full_name?.charAt(0)}
//                       </div>
//                       <div className="min-w-0">
//                         <p className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>{patient?.full_name}</p>
//                         <p className="text-xs text-slate-500">
//                           {age !== null ? `Age ${age}` : ''}
//                           {patient?.patient_profiles?.[0]?.blood_group ? ` · ${patient.patient_profiles[0].blood_group}` : ''}
//                         </p>
//                       </div>
//                     </button>
//                   )
//                 })}
//               </div>
//             )}
//           </Card>
//         </div>

//         {/* Right: Detail Panel */}
//         <div className="flex-1 min-w-0">
//           {!selectedPatient ? (
//             <Card className="flex flex-col items-center justify-center min-h-80 text-center">
//               <Users size={48} className="text-slate-600 mb-4" />
//               <h3 className="text-lg font-semibold text-white mb-2">Select a patient</h3>
//               <p className="text-slate-400 text-sm">Choose a patient from the list to view their health data</p>
//             </Card>
//           ) : (
//             <div className="space-y-3">

//               {/* Patient header */}
//               <Card className="py-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
//                     {(selectedPatient.patient as any)?.full_name?.charAt(0)}
//                   </div>
//                   <div className="min-w-0">
//                     <h2 className="text-base font-bold text-white">{(selectedPatient.patient as any)?.full_name}</h2>
//                     <p className="text-xs text-slate-400">{(selectedPatient.patient as any)?.email}</p>
//                   </div>
//                   <div className="ml-auto flex flex-wrap gap-1.5 justify-end">
//                     {getPatientAge(selectedPatient) !== null && (
//                       <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Age {getPatientAge(selectedPatient)}</span>
//                     )}
//                     {patientProfile?.gender && (
//                       <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
//                         {patientProfile.gender.charAt(0).toUpperCase() + patientProfile.gender.slice(1)}
//                       </span>
//                     )}
//                     {patientProfile?.weight_kg && (
//                       <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{patientProfile.weight_kg} kg</span>
//                     )}
//                     {patientProfile?.height_cm && (
//                       <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{patientProfile.height_cm} cm</span>
//                     )}
//                     {(selectedPatient.patient as any)?.patient_profiles?.[0]?.blood_group && (
//                       <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
//                         {(selectedPatient.patient as any).patient_profiles[0].blood_group}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </Card>

//               {/* Tabs */}
//               <div className="flex gap-2 flex-wrap">
//                 {TABS.map(t => (
//                   <button
//                     key={t.key}
//                     onClick={() => setTab(t.key)}
//                     className={['flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.key ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'].join(' ')}
//                   >
//                     {t.icon} {t.label}
//                     {'count' in t && t.count > 0 && (
//                       <span className="ml-1 text-xs bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full">{t.count}</span>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               {/* Tab: AI Summary */}
//               {tab === 'summary' && (
//                 <Card>
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-base font-semibold text-white flex items-center gap-2"><Brain size={16} className="text-cyan-400" /> AI Health Summary</h3>
//                     <Button size="sm" variant="outline" loading={summaryGenerating} onClick={handleGenerateSummary} icon={<RefreshCw size={14} />}>
//                       {summary ? 'Regenerate' : 'Generate'}
//                     </Button>
//                   </div>
//                   {summaryLoading ? (
//                     <div className="flex justify-center py-8"><Spinner /></div>
//                   ) : summary ? (
//                     <div>
//                       {patientProfile && (
//                         <div className="flex flex-wrap gap-2 mb-4">
//                           {patientProfile.date_of_birth && <Badge variant="amber">{new Date().getFullYear() - new Date(patientProfile.date_of_birth).getFullYear()} years</Badge>}
//                           {patientProfile.gender && <Badge variant="amber">{patientProfile.gender.charAt(0).toUpperCase() + patientProfile.gender.slice(1)}</Badge>}
//                           {patientProfile.blood_group && <Badge variant="amber">{patientProfile.blood_group}</Badge>}
//                         </div>
//                       )}
//                       <div className="bg-white/3 rounded-xl p-4 mb-3"><MarkdownSummary text={summary.summary_text} /></div>
//                       {summary.key_conditions?.length > 0 && (
//                         <div className="mb-3">
//                           <p className="text-xs text-slate-500 mb-1.5">Key Conditions</p>
//                           <div className="flex flex-wrap gap-1.5">{summary.key_conditions.map(c => <Badge key={c} variant="amber">{c}</Badge>)}</div>
//                         </div>
//                       )}
//                       {summary.alert_flags?.length > 0 && (
//                         <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-3">
//                           <p className="text-xs font-medium text-rose-400 mb-1">⚠️ Alerts</p>
//                           {summary.alert_flags.map(f => <p key={f} className="text-xs text-rose-300">• {f}</p>)}
//                         </div>
//                       )}
//                       <p className="text-xs text-slate-600">Generated {new Date(summary.generated_at).toLocaleString()}</p>
//                     </div>
//                   ) : (
//                     <div className="text-center py-10">
//                       <Brain size={36} className="text-slate-600 mx-auto mb-3" />
//                       <p className="text-slate-400">No summary yet</p>
//                       <p className="text-xs text-slate-500 mt-1">Click "Generate" to create an AI-powered health summary</p>
//                     </div>
//                   )}
//                 </Card>
//               )}

//               {/* Tab: Active Medications */}
//               {tab === 'medications' && (
//                 <Card>
//                   <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><Pill size={16} className="text-teal-400" /> Active Medications</h3>
//                   {medsLoading ? <div className="flex justify-center py-8"><Spinner /></div>
//                   : activeMeds.length === 0 ? (
//                     <div className="text-center py-8"><Pill size={32} className="text-slate-600 mx-auto mb-2" /><p className="text-slate-400 text-sm">No active medications</p></div>
//                   ) : (
//                     <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(6,182,212,0.1)' }}>
//                       <table className="w-full text-sm">
//                         <thead>
//                           <tr style={{ background: 'rgba(6,182,212,0.08)' }}>
//                             {['Drug', 'Strength', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map(h => (
//                               <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium text-xs">{h}</th>
//                             ))}
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {activeMeds.map((m, i) => (
//                             <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
//                               <td className="px-4 py-2.5 text-white font-medium">{m.drug_name}</td>
//                               <td className="px-4 py-2.5 text-slate-400">{m.strength || '—'}</td>
//                               <td className="px-4 py-2.5 text-slate-400">{m.dosage || '—'}</td>
//                               <td className="px-4 py-2.5 text-slate-400">{m.frequency || '—'}</td>
//                               <td className="px-4 py-2.5 text-slate-400">{m.duration || '—'}</td>
//                               <td className="px-4 py-2.5 text-slate-500 text-xs">{m.instructions || '—'}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </Card>
//               )}

//               {/* ── Tab: Documents ──────────────────────────────────────────── */}
//               {tab === 'documents' && (
//                 <Card>
//                   <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
//                     <FileText size={16} className="text-cyan-400" />
//                     Patient Documents
//                     {patientDocs.length > 0 && <span className="text-xs text-slate-500 font-normal ml-1">({patientDocs.length} files)</span>}
//                   </h3>

//                   {docsLoading ? (
//                     <div className="flex justify-center py-8"><Spinner /></div>
//                   ) : patientDocs.length === 0 ? (
//                     <div className="text-center py-10">
//                       <FileText size={36} className="text-slate-600 mx-auto mb-3" />
//                       <p className="text-slate-400 text-sm">No documents uploaded yet</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-2">
//                       {patientDocs.map(doc => {
//                         const colorClass = DOC_TYPE_COLORS[doc.document_type] ?? DOC_TYPE_COLORS.other
//                         return (
//                           <div
//                             key={doc.id}
//                             onClick={() => setViewingDoc(doc)}
//                             className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/4 border border-transparent hover:border-cyan-500/20"
//                           >
//                             <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
//                               <FileText size={15} />
//                             </div>
//                             <div className="flex-1 min-w-0">
//                               <p className="text-sm font-medium text-white truncate">{doc.document_name}</p>
//                               <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                                 <span className="text-xs text-slate-500 capitalize">{doc.document_type?.replace(/_/g, ' ')}</span>
//                                 <span className="text-slate-700">·</span>
//                                 <span className="text-xs text-slate-600">
//                                   {new Date(doc.upload_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//                                 </span>
//                                 {doc.file_size ? <><span className="text-slate-700">·</span><span className="text-xs text-slate-600">{fmt(doc.file_size)}</span></> : null}
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-2 flex-shrink-0">
//                               <DocStatusBadge status={doc.processing_status} />
//                               <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-cyan-400">
//                                 <Eye size={12} /> View
//                               </span>
//                             </div>
//                           </div>
//                         )
//                       })}
//                     </div>
//                   )}
//                 </Card>
//               )}

//               {/* Tab: Write Prescription */}
//               {tab === 'prescribe' && (
//                 <Card>
//                   <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
//                     <ClipboardList size={16} className="text-purple-400" /> Write Prescription
//                   </h3>
//                   <div className="space-y-4">
//                     <Input label="Diagnosis" required placeholder="e.g. Type 2 Diabetes Mellitus" value={rxForm.diagnosis} onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))} />
//                     <div>
//                       <div className="flex items-center justify-between mb-2">
//                         <label className="text-sm font-medium text-slate-300">Medications</label>
//                         <Button size="sm" variant="ghost" onClick={addMedRow} icon={<Plus size={14} />}>Add Row</Button>
//                       </div>
//                       <div className="space-y-3">
//                         {medications.map((med, i) => (
//                           <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
//                             <div className="flex items-center justify-between">
//                               <span className="text-xs text-slate-500">Medication {i + 1}</span>
//                               {medications.length > 1 && <button onClick={() => removeMedRow(i)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>}
//                             </div>
//                             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                               <Input placeholder="Drug name" value={med.drug_name} onChange={e => setMed(i, 'drug_name', e.target.value)} />
//                               <Input placeholder="Strength (e.g. 500mg)" value={med.strength} onChange={e => setMed(i, 'strength', e.target.value)} />
//                               <Input placeholder="Dosage (e.g. 1 tablet)" value={med.dosage} onChange={e => setMed(i, 'dosage', e.target.value)} />
//                               <Input placeholder="Frequency (e.g. Twice daily)" value={med.frequency} onChange={e => setMed(i, 'frequency', e.target.value)} />
//                               <Input placeholder="Duration (e.g. 30 days)" value={med.duration} onChange={e => setMed(i, 'duration', e.target.value)} />
//                               <Input placeholder="Special instructions" value={med.instructions ?? ''} onChange={e => setMed(i, 'instructions', e.target.value)} />
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <Input label="Follow-up Date" type="date" value={rxForm.follow_up_date} onChange={e => setRxForm(p => ({ ...p, follow_up_date: e.target.value }))} />
//                       <div />
//                     </div>
//                     <Textarea label="Notes" placeholder="Additional instructions for the patient..." value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} />
//                     <Button onClick={handleSaveRx} loading={rxSaving} icon={<Save size={16} />} size="lg">Save Prescription</Button>
//                   </div>
//                 </Card>
//               )}

//             </div>
//           )}
//         </div>
//       </div>

//       {/* Document viewer overlay */}
//       {viewingDoc && <DocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
//     </DashboardLayout>
//   )
// }

import { useState, useEffect } from 'react'
import { Users, Brain, Pill, ClipboardList, RefreshCw, Plus, Trash2, Save, FileText, Eye, Download, ZoomIn, ZoomOut, RotateCw, AlertCircle, X, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { generateSummary } from '../../lib/api'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import type { Connection, MasterSummary, Medication, MedicalDocument } from '../../types'
import toast from 'react-hot-toast'

type Tab = 'summary' | 'medications' | 'documents' | 'prescribe'

const EMPTY_MED: Medication = { drug_name: '', strength: '', dosage: '', frequency: '', duration: '', instructions: '' }

// ── Markdown renderer — handles ##, **bold**, • bullets ──────────────────────
function MarkdownSummary({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.replace('## ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-cyan-400 mt-0.5 flex-shrink-0">•</span>
              <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</span>
            </div>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-slate-400">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
      })}
    </div>
  )
}

const DOC_TYPE_COLORS: Record<string, string> = {
  lab_report: 'text-cyan-400 bg-cyan-500/15',
  prescription: 'text-purple-400 bg-purple-500/15',
  imaging: 'text-blue-400 bg-blue-500/15',
  discharge_summary: 'text-amber-400 bg-amber-500/15',
  vaccination: 'text-green-400 bg-green-500/15',
  insurance: 'text-rose-400 bg-rose-500/15',
  other: 'text-slate-400 bg-slate-500/15',
}

const fmt = (bytes: number) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const DocStatusBadge = ({ status }: { status: string }) => {
  if (status === 'PROCESSED') return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> Processed
    </span>
  )
  if (status === 'FAILED') return (
    <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
      <AlertCircle size={10} /> Failed
    </span>
  )
  if (status === 'PROCESSING') return (
    <span className="flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
      <Loader2 size={10} className="animate-spin" /> Processing
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
      <Clock size={10} /> Pending
    </span>
  )
}

// ── Document Viewer Overlay ──────────────────────────────────────────────────
function DocViewer({ doc, onClose }: { doc: MedicalDocument; onClose: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imgError, setImgError] = useState(false)

  const isPdf = doc.mime_type === 'application/pdf' || doc.file_path?.endsWith('.pdf')

  useEffect(() => {
    setLoading(true)
    setSignedUrl(null)
    supabase.storage
      .from('medical-documents')
      .createSignedUrl(doc.file_path, 3600)
      .then(({ data }) => {
        setSignedUrl(data?.signedUrl ?? null)
        setLoading(false)
      })
  }, [doc.id])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,18,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(6,182,212,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${DOC_TYPE_COLORS[doc.document_type] ?? DOC_TYPE_COLORS.other}`}>
            <FileText size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{doc.document_name}</p>
            <p className="text-xs text-slate-400 capitalize">
              {doc.document_type?.replace(/_/g, ' ')} · {fmt(doc.file_size ?? 0)}
            </p>
          </div>
          {!isPdf && signedUrl && !imgError && (
            <div className="flex items-center gap-1 mr-2">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"><ZoomOut size={15} /></button>
              <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"><ZoomIn size={15} /></button>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all ml-1"><RotateCw size={15} /></button>
            </div>
          )}
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Download">
              <Download size={15} />
            </a>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-start justify-center p-4 min-h-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3"><Spinner /><p className="text-sm text-slate-400">Loading document...</p></div>
          ) : !signedUrl ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3"><AlertCircle size={36} className="text-rose-400" /><p className="text-sm text-slate-400">Could not load document</p></div>
          ) : isPdf ? (
            <iframe src={`${signedUrl}#toolbar=1`} className="w-full rounded-xl" style={{ height: 'calc(90vh - 130px)', border: 'none' }} title={doc.document_name} />
          ) : (
            <img src={signedUrl} alt={doc.document_name} style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'top center', transition: 'transform 0.2s ease', maxWidth: '100%', borderRadius: '8px' }} />
          )}
        </div>
        {doc.processing_status === 'PROCESSED' && doc.extracted_data && (
          <div className="px-5 py-3 border-t border-white/5 flex-shrink-0" style={{ background: 'rgba(6,182,212,0.04)' }}>
            <p className="text-xs text-slate-500 mb-1">AI Summary</p>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{(doc.extracted_data as any)?.summary ?? 'No summary available'}</p>
            {(doc.extracted_data as any)?.diagnosis?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {((doc.extracted_data as any).diagnosis as string[]).slice(0, 4).map((d: string) => (
                  <span key={d} className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DoctorPatients() {
  const { profile, doctorProfile } = useAuth()
  const [patients, setPatients] = useState<Connection[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Connection | null>(null)
  const [tab, setTab] = useState<Tab>('summary')
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState<MasterSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryGenerating, setSummaryGenerating] = useState(false)
  const [activeMeds, setActiveMeds] = useState<Medication[]>([])
  const [medsLoading, setMedsLoading] = useState(false)
  const [patientProfile, setPatientProfile] = useState<any>(null)

  // Documents tab
  const [patientDocs, setPatientDocs] = useState<MedicalDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<MedicalDocument | null>(null)

  // Prescription form
  const [rxForm, setRxForm] = useState({ diagnosis: '', notes: '', follow_up_date: '' })
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }])
  const [rxSaving, setRxSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('connections')
      .select('*, patient:profiles!patient_id(full_name, email, city, patient_profiles(date_of_birth, blood_group, gender, height_cm, weight_kg))')
      .eq('doctor_id', profile.id)
      .eq('status', 'ACTIVE')
      .then(({ data }) => { setPatients(data ?? []); setLoading(false) })
  }, [profile])

  const selectPatient = async (conn: Connection) => {
    setSelectedPatient(conn)
    setTab('summary')
    setSummary(null)
    setPatientProfile(null)
    setPatientDocs([])
    loadSummary(conn)
    const { data: pp } = await supabase.from('patient_profiles').select('*').eq('profile_id', conn.patient_id).single()
    setPatientProfile(pp)
  }

  const loadSummary = async (conn: Connection) => {
    setSummaryLoading(true)
    const { data } = await supabase
      .from('master_summaries')
      .select('*')
      .eq('patient_id', conn.patient_id)
      .eq('doctor_id', profile!.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()
    setSummary(data ?? null)
    setSummaryLoading(false)
  }

  const handleGenerateSummary = async () => {
    if (!selectedPatient || !profile || !doctorProfile) return
    setSummaryGenerating(true)
    try {
      await generateSummary({ patient_id: selectedPatient.patient_id, doctor_id: profile.id, doctor_specialty: doctorProfile.specialization })
      await loadSummary(selectedPatient)
      toast.success('Summary generated!')
    } catch {
      toast.error('Backend not running.')
    } finally {
      setSummaryGenerating(false)
    }
  }

  const loadActiveMeds = async (conn: Connection) => {
    setMedsLoading(true)
    const { data: rxs } = await supabase.from('prescriptions').select('medications').eq('patient_id', conn.patient_id).eq('is_active', true)
    setActiveMeds((rxs ?? []).flatMap(r => (r.medications as Medication[]) ?? []))
    setMedsLoading(false)
  }

  const loadPatientDocs = async (conn: Connection) => {
    setDocsLoading(true)
    const { data } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', conn.patient_id)
      .order('upload_date', { ascending: false })
    setPatientDocs(data ?? [])
    if (data && data.length > 0) {
      toast.success(`Fetched ${data.length} documents. Filtering for your specialty...`)
    } else {
      toast.error('No documents returned from database. (Check RLS policies?)')
    }
    setDocsLoading(false)
  }

  useEffect(() => {
    if (!selectedPatient) return
    if (tab === 'medications') loadActiveMeds(selectedPatient)
    if (tab === 'documents') loadPatientDocs(selectedPatient)
  }, [tab, selectedPatient])

  const addMedRow = () => setMedications(prev => [...prev, { ...EMPTY_MED }])
  const removeMedRow = (i: number) => setMedications(prev => prev.filter((_, idx) => idx !== i))
  const setMed = (i: number, field: keyof Medication, val: string) =>
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const handleSaveRx = async () => {
    if (!selectedPatient || !profile) return
    if (!rxForm.diagnosis) { toast.error('Diagnosis is required'); return }
    const validMeds = medications.filter(m => m.drug_name)
    if (validMeds.length === 0) { toast.error('Add at least one medication'); return }
    setRxSaving(true)
    try {
      const { error } = await supabase.from('prescriptions').insert({
        patient_id: selectedPatient.patient_id,
        doctor_id: profile.id,
        diagnosis: rxForm.diagnosis,
        medications: validMeds,
        notes: rxForm.notes || null,
        follow_up_date: rxForm.follow_up_date || null,
        is_active: true,
        version: 1,
      })
      if (error) throw error
      toast.success('Prescription saved!')
      setRxForm({ diagnosis: '', notes: '', follow_up_date: '' })
      setMedications([{ ...EMPTY_MED }])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setRxSaving(false)
    }
  }

  const getPatientAge = (conn: Connection) => {
    const dob = (conn.patient as any)?.patient_profiles?.[0]?.date_of_birth
    if (!dob) return null
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  }

  const isRelatedToSpecialty = (doc: MedicalDocument) => {
    if (!doctorProfile?.specialization) return true
    const spec = doctorProfile.specialization.toLowerCase()
    const name = doc.document_name.toLowerCase()
    const type = doc.document_type.toLowerCase()
    const extracted = (doc.extracted_data as any) || {}
    const summaryText = (extracted.summary || '').toLowerCase()
    const diagnoses = (extracted.diagnosis || []).map((d: any) => d.toLowerCase())

    // Normalize 'ae' -> 'e' for medical term matching
    const norm = (t: string) => t.replace(/ae/g, 'e')
    const sNorm = norm(spec)
    const nNorm = norm(name)
    const tyNorm = norm(type)
    const stNorm = norm(summaryText)

    // Split into searchable roots (3+ chars)
    const getRoots = (text: string) =>
      text.split(/[\s\-_,./()]+/)
        .filter(w => w.length >= 3)
        .map(w => w.substring(0, 3)) // Compare first 3 chars of words (e.g., 'gyn', 'der', 'car')

    const specRoots = getRoots(sNorm)
    const docTextRoots = [
      ...getRoots(nNorm),
      ...getRoots(tyNorm),
      ...getRoots(stNorm),
      ...diagnoses.flatMap((d: any) => getRoots(norm(d)))
    ]

    // Match if any specialty root exists in document roots
    const hasMatch = specRoots.some(sr => docTextRoots.includes(sr)) ||
      nNorm.includes(sNorm) || sNorm.includes(nNorm) ||
      (sNorm.includes('gyn') && nNorm.includes('gyn')) // Explicitly handle gyno/gyne

    // If specialty is very short or generic, be more inclusive
    if (sNorm.length < 3) return true

    return hasMatch
  }

  const filteredDocs = patientDocs.filter(isRelatedToSpecialty)

  const TABS = [
    { key: 'summary' as const, label: 'AI Summary', icon: <Brain size={15} /> },
    { key: 'medications' as const, label: 'Active Medications', icon: <Pill size={15} /> },
    { key: 'documents' as const, label: 'Documents', icon: <FileText size={15} />, count: filteredDocs.length },
    { key: 'prescribe' as const, label: 'Write Prescription', icon: <ClipboardList size={15} /> },
  ]

  return (
    <DashboardLayout title="My Patients" subtitle={`${patients.length} active patient${patients.length !== 1 ? 's' : ''}`}>
      <div className="flex gap-4 h-full">
        <div className="w-64 flex-shrink-0">
          <Card className="p-0 overflow-hidden">
            <div className="p-3 border-b border-cyan-500/10">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Users size={16} className="text-cyan-400" />
                Patients ({patients.length})
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Users size={28} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No active patients</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[70vh]">
                {patients.map(conn => {
                  const patient = conn.patient as any
                  const isSelected = selectedPatient?.id === conn.id
                  return (
                    <button
                      key={conn.id}
                      onClick={() => selectPatient(conn)}
                      className={['w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200', isSelected ? 'bg-cyan-500/15 border-l-2 border-cyan-500' : 'hover:bg-white/3 border-l-2 border-transparent'].join(' ')}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${isSelected ? 'bg-gradient-to-br from-cyan-500 to-teal-500' : 'bg-slate-700'}`}>
                        {patient?.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>{patient?.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {getPatientAge(conn) !== null ? `Age ${getPatientAge(conn)}` : ''}
                          {patient?.patient_profiles?.[0]?.blood_group ? ` · ${patient.patient_profiles[0].blood_group}` : ''}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="flex-1 min-w-0">
          {!selectedPatient ? (
            <Card className="flex flex-col items-center justify-center min-h-80 text-center">
              <Users size={48} className="text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Select a patient</h3>
              <p className="text-slate-400 text-sm">Choose a patient from the list to view their health data</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <Card className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {(selectedPatient.patient as any)?.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white">{(selectedPatient.patient as any)?.full_name}</h2>
                    <p className="text-xs text-slate-400">{(selectedPatient.patient as any)?.email}</p>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-1.5 justify-end">
                    {getPatientAge(selectedPatient) !== null && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Age {getPatientAge(selectedPatient)}</span>}
                    {patientProfile?.gender && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{patientProfile.gender}</span>}
                    {patientProfile?.weight_kg && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{patientProfile.weight_kg} kg</span>}
                    {patientProfile?.height_cm && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">{patientProfile.height_cm} cm</span>}
                    {patientProfile?.blood_group && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">{patientProfile.blood_group}</span>}
                  </div>
                </div>
              </Card>

              <div className="flex gap-2 flex-wrap">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={['flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.key ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'].join(' ')}
                  >
                    {t.icon} {t.label}
                    {'count' in t && (t as any).count >= 0 && (
                      <span className="ml-1 text-xs bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full">{(t as any).count}</span>
                    )}
                  </button>
                ))}
              </div>

              {tab === 'summary' && (
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2"><Brain size={16} className="text-cyan-400" /> AI Health Summary</h3>
                    <Button size="sm" variant="outline" loading={summaryGenerating} onClick={handleGenerateSummary} icon={<RefreshCw size={14} />}>
                      {summary ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                  {summaryLoading ? <div className="flex justify-center py-8"><Spinner /></div> : summary ? (
                    <div>
                      <div className="bg-white/3 rounded-xl p-4 mb-3"><MarkdownSummary text={summary.summary_text} /></div>
                      {summary.key_conditions && summary.key_conditions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-1.5">Key Conditions</p>
                          <div className="flex flex-wrap gap-1.5">{summary.key_conditions.map(c => <Badge key={c} variant="amber">{c}</Badge>)}</div>
                        </div>
                      )}
                      <p className="text-xs text-slate-600">Generated {new Date(summary.generated_at).toLocaleString()}</p>
                    </div>
                  ) : <div className="text-center py-10"><Brain size={36} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No summary yet</p></div>}
                </Card>
              )}

              {tab === 'medications' && (
                <Card>
                  <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><Pill size={16} className="text-teal-400" /> Active Medications</h3>
                  {medsLoading ? <div className="flex justify-center py-8"><Spinner /></div>
                    : activeMeds.length === 0 ? <div className="text-center py-8"><Pill size={32} className="text-slate-600 mx-auto mb-2" /><p className="text-slate-400 text-sm">No active medications</p></div>
                      : (
                        <div className="overflow-x-auto rounded-xl border border-white/5">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-white/2 text-slate-400 text-xs uppercase">
                              <tr>
                                {['Drug', 'Strength', 'Dosage', 'Frequency', 'Duration'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {activeMeds.map((m, i) => (
                                <tr key={i} className="text-slate-300">
                                  <td className="px-4 py-3 text-white font-medium">{m.drug_name}</td>
                                  <td className="px-4 py-3">{m.strength}</td>
                                  <td className="px-4 py-3">{m.dosage}</td>
                                  <td className="px-4 py-3">{m.frequency}</td>
                                  <td className="px-4 py-3">{m.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                </Card>
              )}

              {tab === 'documents' && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2"><FileText size={16} className="text-cyan-400" /> Patient Documents</h3>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Filtered by: {doctorProfile?.specialization || 'General'}</span>
                    </div>
                  </div>

                  {docsLoading ? <div className="flex justify-center py-8"><Spinner /></div> : patientDocs.length === 0 ? (
                    <div className="text-center py-10">
                      <FileText size={36} className="text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No documents found for this patient.</p>
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-10">
                      <Brain size={36} className="text-cyan-600/50 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Found {patientDocs.length} documents, but none match the specialty "{doctorProfile?.specialization}".</p>
                      <p className="text-[10px] text-slate-600 mt-2">The filter checks document names, types, and AI-extracted summaries.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDocs.map(doc => (
                        <div key={doc.id} onClick={() => setViewingDoc(doc)} className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/4 border border-transparent hover:border-cyan-500/20 transition-all">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${DOC_TYPE_COLORS[doc.document_type] ?? DOC_TYPE_COLORS.other}`}>
                            <FileText size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{doc.document_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{doc.document_type.replace(/_/g, ' ')} · {new Date(doc.upload_date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <DocStatusBadge status={doc.processing_status} />
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-cyan-400"><Eye size={12} /> View</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {tab === 'prescribe' && (
                <Card>
                  <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-purple-400" /> Write Prescription</h3>
                  <div className="space-y-4">
                    <Input label="Diagnosis" required placeholder="e.g. Type 2 Diabetes" value={rxForm.diagnosis} onChange={e => setRxForm(p => ({ ...p, diagnosis: e.target.value }))} />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-300">Medications</label>
                        <Button size="sm" variant="ghost" onClick={addMedRow} icon={<Plus size={14} />}>Add Row</Button>
                      </div>
                      <div className="space-y-3">
                        {medications.map((med, i) => (
                          <div key={i} className="p-4 rounded-xl space-y-3 bg-white/3 border border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Medication {i + 1}</span>
                              {medications.length > 1 && <button onClick={() => removeMedRow(i)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <Input placeholder="Drug name" value={med.drug_name} onChange={e => setMed(i, 'drug_name', e.target.value)} />
                              <Input placeholder="Strength" value={med.strength} onChange={e => setMed(i, 'strength', e.target.value)} />
                              <Input placeholder="Dosage" value={med.dosage} onChange={e => setMed(i, 'dosage', e.target.value)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Textarea label="Notes" placeholder="Instructions..." value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} />
                    <Button onClick={handleSaveRx} loading={rxSaving} icon={<Save size={16} />} fullWidth>Save Prescription</Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      {viewingDoc && <DocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </DashboardLayout>
  )
}