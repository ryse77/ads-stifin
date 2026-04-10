"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  CalendarCheck,
  Bell,
  Clock,
  CheckCircle,
  FileText,
  Play,
  BarChart3,
  DollarSign,
  TrendingUp,
  Loader2,
  Plus,
  Megaphone,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdReport {
  id: string
  cpr: number | null
  totalLeads: number | null
  amountSpent: number | null
}

interface BriefTemplate {
  id: string
  type: string
  name: string
  content: string
}

interface AdRequest {
  id: string
  promotorName: string
  promotor: { id: string; name: string; email: string; city: string }
  city: string
  startDate: string
  durationDays: number
  dailyBudget: number
  totalBudget: number
  ppn: number
  totalPayment: number
  status: string
  briefType: string | null
  briefContent: string | null
  briefVO: string | null
  briefJJ: string | null
  paymentProofUrl: string | null
  adStartDate: string | null
  adEndDate: string | null
  adReport: AdReport | null
}

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (value: number): string =>
  `Rp ${value.toLocaleString("id-ID")}`

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const HARI_INDONESIA = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
]

const formatJadwalInfo = (dateStr: string, cityName: string): string => {
  const date = new Date(dateStr)
  const hari = HARI_INDONESIA[date.getDay()]
  const tanggal = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return `📅 ${hari}, ${tanggal} - di Kota ${cityName}!`
}

const statusConfig: Record<
  string,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    className: string
  }
> = {
  MENUNGGU_PEMBAYARAN: {
    label: "Menunggu Pembayaran",
    variant: "outline",
    className: "border-amber-500 text-amber-700 bg-amber-50",
  },
  MENUNGGU_KONTEN: {
    label: "Menunggu Konten",
    variant: "outline",
    className: "border-orange-500 text-orange-700 bg-orange-50",
  },
  DIPROSES: {
    label: "Diproses",
    variant: "outline",
    className: "border-blue-500 text-blue-700 bg-blue-50",
  },
  KONTEN_SELESAI: {
    label: "Konten Selesai",
    variant: "outline",
    className: "border-green-500 text-green-700 bg-green-50",
  },
  IKLAN_DIJADWALKAN: {
    label: "Iklan Dijadwalkan",
    variant: "outline",
    className: "border-blue-500 text-blue-700 bg-blue-50",
  },
  IKLAN_BERJALAN: {
    label: "Iklan Berjalan",
    variant: "outline",
    className: "border-purple-500 text-purple-700 bg-purple-50",
  },
  SELESAI: {
    label: "Selesai",
    variant: "secondary",
    className: "border-gray-400 text-gray-600 bg-gray-100",
  },
}

const getStatusBadge = (status: string) => {
  const config = statusConfig[status]
  if (!config) {
    return (
      <Badge variant="outline" className="border-gray-400 text-gray-600">
        {status}
      </Badge>
    )
  }
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}

const getBriefTypeBadge = (briefType: string) => {
  if (briefType === "JJ") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200">
        Jedag Jedug
      </Badge>
    )
  }
  if (briefType === "VO") {
    return (
      <Badge className="bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200">
        Voice Over
      </Badge>
    )
  }
  return <Badge variant="secondary">{briefType}</Badge>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdvertiserDashboard() {
  const { user } = useAuth()
  const [adRequests, setAdRequests] = useState<AdRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Action states
  const [SchedulingAd, setSchedulingAd] = useState<AdRequest | null>(null)
  const [scheduleMode, setScheduleMode] = useState<"DEFAULT" | "CUSTOM">("DEFAULT")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [schedulingId, setSchedulingId] = useState<string | null>(null)

  // Brief editing states
  const [editingBriefAd, setEditingBriefAd] = useState<AdRequest | null>(null)
  const [editBriefVO, setEditBriefVO] = useState("")
  const [editBriefJJ, setEditBriefJJ] = useState("")
  const [updatingBrief, setUpdatingBrief] = useState(false)

  // Master Brief states
  const [briefTemplates, setBriefTemplates] = useState<BriefTemplate[]>([])
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BriefTemplate | null>(null)
  const [templateType, setTemplateType] = useState<"VO" | "JJ">("VO")
  const [templateName, setTemplateName] = useState("")
  const [templateContent, setTemplateContent] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [reportDialogId, setReportDialogId] = useState<string | null>(null)
  const [reportCpr, setReportCpr] = useState("")
  const [reportTotalLeads, setReportTotalLeads] = useState("")
  const [reportAmountSpent, setReportAmountSpent] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  // Notification states
  const [notifLoading, setNotifLoading] = useState(false)
  const [readingNotifId, setReadingNotifId] = useState<string | null>(null)

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Fetch ad requests ────────────────────────────────────────────────────

  const fetchAdRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/ad-requests")
      if (!res.ok) throw new Error("Gagal mengambil data")
      const data: AdRequest[] = await res.json()
      setAdRequests(data)
    } catch {
      toast.error("Gagal memuat data pengajuan iklan")
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Gagal mengambil notifikasi")
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadNotifCount(data.unreadCount || 0)
    } catch {
      // Silently fail for notifications
    } finally {
      setNotifLoading(false)
    }
  }, [])

  const fetchBriefTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch("/api/brief-templates")
      if (!res.ok) throw new Error("Gagal mengambil template")
      const data = await res.json()
      setBriefTemplates(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchAdRequests()
      fetchNotifications()
      fetchBriefTemplates()
    }
  }, [user, fetchAdRequests, fetchNotifications, fetchBriefTemplates])



  // ── Computed stats ───────────────────────────────────────────────────────

  const menungguJadwalCount = adRequests.filter(
    (r) => r.status === "KONTEN_SELESAI"
  ).length
  const iklanBerjalanCount = adRequests.filter(
    (r) => r.status === "IKLAN_BERJALAN"
  ).length
  const selesaiCount = adRequests.filter(
    (r) => r.status === "SELESAI"
  ).length

  // Summary: total amount spent and total leads from completed ads
  const totalAmountSpent = adRequests.reduce((sum, r) => {
    if (r.adReport && r.adReport.amountSpent !== null) {
      return sum + r.adReport.amountSpent
    }
    return sum
  }, 0)

  const totalLeadsGenerated = adRequests.reduce((sum, r) => {
    if (r.adReport && r.adReport.totalLeads !== null) {
      return sum + r.adReport.totalLeads
    }
    return sum
  }, 0)

  // ── Schedule ad (KONTEN_SELESAI → IKLAN_BERJALAN) ────────────────────────

  const handleSchedule = async (id: string, start: Date, end: Date) => {
    setSchedulingId(id)
    try {
      const res = await fetch(`/api/ad-requests/${id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adStartDate: start.toISOString(),
          adEndDate: end.toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menjadwalkan iklan")
      }
      toast.success("Iklan berhasil dijadwalkan!")
      setSchedulingAd(null)
      fetchAdRequests()
      fetchNotifications()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menjadwalkan iklan"
      toast.error(message)
    } finally {
      setSchedulingId(null)
    }
  }

  const handleUpdateBrief = async () => {
    if (!editingBriefAd) return
    setUpdatingBrief(true)
    try {
      const res = await fetch(`/api/ad-requests/${editingBriefAd.id}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefVO: editBriefVO,
          briefJJ: editBriefJJ,
        }),
      })
      if (!res.ok) throw new Error("Gagal update brief")
      toast.success("Brief berhasil diperbarui!")
      setEditingBriefAd(null)
      fetchAdRequests()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal update brief")
    } finally {
      setUpdatingBrief(false)
    }
  }

  // ── Submit report (IKLAN_BERJALAN → SELESAI) ─────────────────────────────

  const handleSubmitReport = async () => {
    if (!reportDialogId) return

    const cpr = parseFloat(reportCpr)
    const totalLeads = parseInt(reportTotalLeads, 10)
    const amountSpent = parseFloat(reportAmountSpent)

    if (isNaN(cpr) || isNaN(totalLeads) || isNaN(amountSpent)) {
      toast.error("Semua field wajib diisi dengan angka yang valid")
      return
    }
    if (cpr < 0 || totalLeads < 0 || amountSpent < 0) {
      toast.error("Nilai tidak boleh negatif")
      return
    }

    setSubmittingReport(true)
    try {
      const res = await fetch(`/api/ad-requests/${reportDialogId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpr, totalLeads, amountSpent }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal submit laporan")
      }
      toast.success("Laporan iklan berhasil disimpan!")
      setReportDialogId(null)
      setReportCpr("")
      setReportTotalLeads("")
      setReportAmountSpent("")
      fetchAdRequests()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal submit laporan"
      toast.error(message)
    } finally {
      setSubmittingReport(false)
    }
  }

  // ── Mark notification as read ────────────────────────────────────────────

  const handleMarkRead = async (notifId: string) => {
    setReadingNotifId(notifId)
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Gagal menandai notifikasi")
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      )
      setUnreadNotifCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error("Gagal menandai notifikasi sebagai dibaca")
    } finally {
      setReadingNotifId(null)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName || !templateContent) {
      toast.error("Nama dan konten wajib diisi")
      return
    }
    setSavingTemplate(true)
    try {
      const url = editingTemplate 
        ? `/api/brief-templates/${editingTemplate.id}` 
        : "/api/brief-templates"
      const res = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: templateType,
          name: templateName,
          content: templateContent,
        }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan template")
      toast.success("Template berhasil disimpan!")
      setIsTemplateDialogOpen(false)
      fetchBriefTemplates()
    } catch (err) {
      toast.error("Gagal menyimpan template")
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Hapus template ini?")) return
    try {
      const res = await fetch(`/api/brief-templates/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast.success("Template dihapus")
      fetchBriefTemplates()
    } catch (err) {
      toast.error("Gagal menghapus template")
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success("Teks berhasil disalin!")
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Summary skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header with Notification Bell ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Advertiser
          </h1>
          <p className="text-muted-foreground">
            Kelola penjadwalan dan laporan iklan untuk semua pengajuan
          </p>
        </div>


      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menunggu Dijadwalkan
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {menungguJadwalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Konten siap untuk dijadwalkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Iklan Berjalan
            </CardTitle>
            <Play className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {iklanBerjalanCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Iklan sedang aktif berjalan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Iklan Selesai
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {selesaiCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Iklan sudah selesai dengan laporan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Summary Section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Biaya Iklan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatRupiah(totalAmountSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total amount spent dari semua iklan selesai
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads Dihasilkan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700">
              {totalLeadsGenerated.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total leads dari semua iklan selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="iklan" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="iklan">Daftar Iklan</TabsTrigger>
          <TabsTrigger value="master-brief">Master Brief (VO & JJ)</TabsTrigger>
        </TabsList>

        <TabsContent value="iklan" className="space-y-6 mt-6">
          {/* Ad Request Cards */}
          <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Daftar Pengajuan Iklan</h2>
          <p className="text-sm text-muted-foreground">
            Semua pengajuan iklan dari promotor
          </p>
        </div>

        {adRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Belum ada pengajuan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pengajuan iklan baru dari promotor akan muncul di sini
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {adRequests.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        Iklan {ad.city}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Promotor:{" "}
                        <span className="font-medium text-foreground">
                          {ad.promotorName}
                        </span>
                        {" · "}
                        {ad.city}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ad.briefType && getBriefTypeBadge(ad.briefType)}
                      {getStatusBadge(ad.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Jadwal Info - advertiser specific */}
                  <div className="rounded-lg bg-muted/50 border p-3 text-sm font-medium flex items-center justify-between group">
                    <span>{formatJadwalInfo(ad.startDate, ad.city)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(formatJadwalInfo(ad.startDate, ad.city), ad.id)}
                    >
                      {copiedId === ad.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Promotor
                      </p>
                      <p className="font-medium">{ad.promotorName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Durasi
                      </p>
                      <p className="font-medium">{ad.durationDays} hari</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Total Budget
                      </p>
                      <p className="font-medium">
                        {formatRupiah(ad.totalBudget)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Total Bayar
                      </p>
                      <p className="font-medium">
                        {formatRupiah(ad.totalPayment)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons based on status */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* KONTEN_SELESAI → Jadwalkan Iklan */}
                    {ad.status === "KONTEN_SELESAI" && (
                      <Dialog
                        open={SchedulingAd?.id === ad.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setSchedulingAd(ad)
                            setScheduleMode("DEFAULT")
                            // Calculate default dates
                            const start = new Date(ad.startDate)
                            start.setDate(start.getDate() - 4)
                            start.setHours(16, 0, 0, 0) // 4 Sore
                            const end = new Date(start)
                            end.setDate(end.getDate() + ad.durationDays)
                            end.setHours(21, 0, 0, 0) // 9 Malam

                            // Format for input (YYYY-MM-DDTHH:MM)
                            const format = (d: Date) => {
                              const pad = (n: number) => String(n).padStart(2, '0')
                              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                            }
                            setCustomStartDate(format(start))
                            setCustomEndDate(format(end))
                          } else {
                            setSchedulingAd(null)
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <CalendarCheck className="h-4 w-4 mr-2" />
                            Jadwalkan Iklan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Jadwalkan Iklan</DialogTitle>
                            <DialogDescription>
                              Pilih mode penjadwalan untuk iklan di <strong>{ad.city}</strong>
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs value={scheduleMode} onValueChange={(v) => setScheduleMode(v as any)}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="DEFAULT">Default</TabsTrigger>
                              <TabsTrigger value="CUSTOM">Custom</TabsTrigger>
                            </TabsList>
                            <div className="py-4 space-y-4">
                              {scheduleMode === "DEFAULT" ? (
                                <div className="rounded-md bg-blue-50 p-3 border border-blue-100 text-sm space-y-2">
                                  <div className="flex justify-between items-center text-blue-700">
                                    <span className="font-medium">Mulai:</span>
                                    <span>{new Date(customStartDate).toLocaleString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-blue-700">
                                    <span className="font-medium">Selesai:</span>
                                    <span>{new Date(customEndDate).toLocaleString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-xs text-blue-600 italic">
                                    *Jadwal default: Mulai 4 hari sebelum hari H ({new Date(ad.startDate).toLocaleDateString("id-ID")}) jam 16:00, berakhir jam 21:00.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Tanggal & Jam Mulai Aktif</Label>
                                    <Input
                                      type="datetime-local"
                                      value={customStartDate}
                                      onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Tanggal & Jam Berhenti Aktif</Label>
                                    <Input
                                      type="datetime-local"
                                      value={customEndDate}
                                      onChange={(e) => setCustomEndDate(e.target.value)}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </Tabs>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSchedulingAd(null)}>Batal</Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              disabled={schedulingId === ad.id}
                              onClick={() => handleSchedule(ad.id, new Date(customStartDate), new Date(customEndDate))}
                            >
                              {schedulingId === ad.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Konfirmasi Jadwal
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}



                    {/* IKLAN_BERJALAN → Input Laporan Iklan */}
                    {ad.status === "IKLAN_BERJALAN" && (
                      <Dialog
                        open={reportDialogId === ad.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setReportDialogId(ad.id)
                            // Pre-fill if report exists
                            if (ad.adReport) {
                              setReportCpr(
                                ad.adReport.cpr !== null
                                  ? String(ad.adReport.cpr)
                                  : ""
                              )
                              setReportTotalLeads(
                                ad.adReport.totalLeads !== null
                                  ? String(ad.adReport.totalLeads)
                                  : ""
                              )
                              setReportAmountSpent(
                                ad.adReport.amountSpent !== null
                                  ? String(ad.adReport.amountSpent)
                                  : ""
                              )
                            } else {
                              setReportCpr("")
                              setReportTotalLeads("")
                              setReportAmountSpent("")
                            }
                          } else {
                            setReportDialogId(null)
                          }
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReportDialogId(ad.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Input Laporan Iklan
                        </Button>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Input Laporan Iklan</DialogTitle>
                            <DialogDescription>
                              Laporkan hasil iklan untuk{" "}
                              <strong>{ad.city}</strong> oleh{" "}
                              <strong>{ad.promotorName}</strong>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            {/* Jadwal reminder */}
                            <div className="rounded-lg bg-muted/50 border p-3 text-sm">
                              {formatJadwalInfo(ad.startDate, ad.city)}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`cpr-${ad.id}`}>
                                CPR (Cost Per Result)
                              </Label>
                              <Input
                                id={`cpr-${ad.id}`}
                                type="number"
                                step="any"
                                placeholder="Contoh: 15000.50"
                                min={0}
                                value={reportCpr}
                                onChange={(e) => setReportCpr(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`leads-${ad.id}`}>
                                Total Leads
                              </Label>
                              <Input
                                id={`leads-${ad.id}`}
                                type="number"
                                step="1"
                                placeholder="Contoh: 25"
                                min={0}
                                value={reportTotalLeads}
                                onChange={(e) =>
                                  setReportTotalLeads(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`spent-${ad.id}`}>
                                Amount Spent (Rupiah)
                              </Label>
                              <Input
                                id={`spent-${ad.id}`}
                                type="number"
                                step="any"
                                placeholder="Contoh: 500000"
                                min={0}
                                value={reportAmountSpent}
                                onChange={(e) =>
                                  setReportAmountSpent(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setReportDialogId(null)}
                              disabled={submittingReport}
                            >
                              Batal
                            </Button>
                            <Button
                              onClick={handleSubmitReport}
                              disabled={submittingReport}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {submittingReport ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Menyimpan...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Simpan Laporan
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Other statuses → info text */}
                    {!["KONTEN_SELESAI", "IKLAN_BERJALAN", "SELESAI"].includes(
                      ad.status
                    ) && (
                        <p className="text-sm text-muted-foreground italic">
                          {ad.status === "MENUNGGU_PEMBAYARAN" &&
                            "Menunggu promotor melakukan pembayaran."}
                          {ad.status === "MENUNGGU_KONTEN" &&
                            "Menunggu pembayaran dikonfirmasi & konten dibuat."}
                          {ad.status === "DIPROSES" &&
                            "Konten sedang dalam pengerjaan oleh konten kreator."}
                        </p>
                      )}
                  </div>

                  {/* Report display for SELESAI status */}
                  {ad.status === "SELESAI" && ad.adReport && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <BarChart3 className="h-4 w-4" />
                        Laporan Iklan
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-md bg-white p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">
                            CPR
                          </p>
                          <p className="font-semibold text-green-800">
                            {formatRupiah(Math.round(ad.adReport.cpr || 0))}
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Total Leads
                          </p>
                          <p className="font-semibold text-green-800">
                            {(ad.adReport.totalLeads || 0).toLocaleString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Amount Spent
                          </p>
                          <p className="font-semibold text-green-800">
                            {formatRupiah(ad.adReport.amountSpent || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IKLAN_BERJALAN with existing report (partial data) */}
                  {ad.status === "IKLAN_BERJALAN" && ad.adReport && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                        <Play className="h-4 w-4" />
                        Data Laporan Terakhir
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-md bg-white p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">
                            CPR
                          </p>
                          <p className="font-semibold text-purple-800">
                            {ad.adReport.cpr !== null
                              ? formatRupiah(Math.round(ad.adReport.cpr))
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Total Leads
                          </p>
                          <p className="font-semibold text-purple-800">
                            {ad.adReport.totalLeads !== null
                              ? ad.adReport.totalLeads.toLocaleString("id-ID")
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-md bg-white p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Amount Spent
                          </p>
                          <p className="font-semibold text-purple-800">
                            {ad.adReport.amountSpent !== null
                              ? formatRupiah(ad.adReport.amountSpent)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TabsContent>

        <TabsContent value="master-brief" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Master Database Brief</h2>
              <p className="text-sm text-muted-foreground">Kelola template brief untuk digunakan otomatis oleh sistem</p>
            </div>
            <Button onClick={() => {
              setEditingTemplate(null)
              setTemplateType("VO")
              setTemplateName("")
              setTemplateContent("")
              setIsTemplateDialogOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Konten Brief
            </Button>
          </div>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Tambah Template Brief"}</DialogTitle>
                <DialogDescription>
                  Gunakan variabel <strong>{`{city}`}</strong>, <strong>{`{day}`}</strong>, dan <strong>{`{date}`}</strong> untuk penggantian otomatis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Konten</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant={templateType === "VO" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTemplateType("VO")}
                      >VO</Button>
                      <Button 
                        type="button"
                        variant={templateType === "JJ" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTemplateType("JJ")}
                      >JJ</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Template (Label)</Label>
                    <Input 
                      placeholder="Contoh: Promo Ramadhan Kota..." 
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Isi Konten Brief</Label>
                  <Textarea 
                    className="min-h-[300px] font-mono text-sm" 
                    placeholder="Masukkan konten brief di sini..."
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                  {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VO Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-blue-700 p-2 bg-blue-50 rounded-lg w-fit">
                <Megaphone className="h-4 w-4" />
                Daftar Master Brief Voice Over (VO)
              </div>
              <div className="space-y-3">
                {briefTemplates.filter(t => t.type === "VO").length === 0 ? (
                  <div className="text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground text-sm">
                    Belum ada template VO
                  </div>
                ) : (
                  briefTemplates.filter(t => t.type === "VO").map(t => (
                    <Card key={t.id} className="overflow-hidden">
                      <CardHeader className="py-3 bg-muted/30 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                            setEditingTemplate(t)
                            setTemplateType("VO")
                            setTemplateName(t.name)
                            setTemplateContent(t.content)
                            setIsTemplateDialogOpen(true)
                          }}><FileText className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(t.id)}><AlertCircle className="h-3 w-3" /></Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap font-mono">
                          {t.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* JJ Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-amber-700 p-2 bg-amber-50 rounded-lg w-fit">
                <Play className="h-4 w-4" />
                Daftar Master Brief Jedag-Jedug (JJ)
              </div>
              <div className="space-y-3">
                {briefTemplates.filter(t => t.type === "JJ").length === 0 ? (
                  <div className="text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground text-sm">
                    Belum ada template JJ
                  </div>
                ) : (
                  briefTemplates.filter(t => t.type === "JJ").map(t => (
                    <Card key={t.id} className="overflow-hidden">
                      <CardHeader className="py-3 bg-muted/30 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                            setEditingTemplate(t)
                            setTemplateType("JJ")
                            setTemplateName(t.name)
                            setTemplateContent(t.content)
                            setIsTemplateDialogOpen(true)
                          }}><FileText className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(t.id)}><AlertCircle className="h-3 w-3" /></Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap font-mono">
                          {t.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
