"use client"

import { useAuth } from "@/lib/auth-context"
import { useState, useEffect, Component, ReactNode } from "react"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Error Boundary
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

const ErrorFallback = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
    <h3 className="text-lg font-semibold text-slate-900 mb-2">Gagal Memuat {label}</h3>
    <p className="text-sm text-slate-500 mb-4">Terjadi kesalahan saat memuat dashboard.</p>
    <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
      <RefreshCw className="w-4 h-4" /> Refresh
    </Button>
  </div>
)

// Individual dashboard loader components
function PromotorView() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    import("@/components/promotor-dashboard")
      .then((m) => setComp(() => m.default))
      .catch(() => {})
  }, [])
  if (!Comp) return <DashboardLoader />
  return <Comp />
}

function KontenKreatorView() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    import("@/components/konten-kreator-dashboard")
      .then((m) => setComp(() => m.default))
      .catch(() => {})
  }, [])
  if (!Comp) return <DashboardLoader />
  return <Comp />
}

function AdvertiserView() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    import("@/components/advertiser-dashboard")
      .then((m) => setComp(() => m.default))
      .catch(() => {})
  }, [])
  if (!Comp) return <DashboardLoader />
  return <Comp />
}

function StifinView() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    import("@/components/stifin-dashboard")
      .then((m) => setComp(() => m.default))
      .catch(() => {})
  }, [])
  if (!Comp) return <DashboardLoader />
  return <Comp />
}

function DashboardLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <ErrorBoundary fallback={<ErrorFallback label="Dashboard" />}>
        {user.role === "PROMOTOR" && <PromotorView />}
        {user.role === "KONTEN_KREATOR" && <KontenKreatorView />}
        {user.role === "ADVERTISER" && <AdvertiserView />}
        {user.role === "STIFIN" && <StifinView />}
      </ErrorBoundary>
    </DashboardLayout>
  )
}
