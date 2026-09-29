'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock3, MapPin, PackageSearch, Plus, ShieldCheck } from 'lucide-react'
import type { LostFoundItem, LostFoundType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

const emptyReport = {
  type: 'found' as LostFoundType,
  title: '',
  description: '',
  category: '',
  location: '',
  dateTime: '',
  reportedBy: '',
  contact: '',
  foundByName: ''
}

async function fetchItems(): Promise<LostFoundItem[]> {
  const response = await fetch('/api/lost-and-found')
  if (!response.ok) throw new Error('Failed to load lost and found reports')
  return response.json()
}

export function LostAndFoundPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [report, setReport] = useState(emptyReport)
  const [claimingItem, setClaimingItem] = useState<LostFoundItem | null>(null)
  const [claim, setClaim] = useState({ claimantName: '', claimantContact: '', proof: '' })
  const { data: items = [], isLoading, error } = useQuery({ queryKey: ['lost-and-found'], queryFn: fetchItems })

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/lost-and-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
      if (!response.ok) throw new Error('Please complete all report fields')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lost-and-found'] })
      setReport(emptyReport)
      toast({ title: 'Report posted', description: 'The campus community can now see this item.' })
    },
    onError: (mutationError: Error) => toast({ title: 'Could not post report', description: mutationError.message, variant: 'destructive' })
  })

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!claimingItem) throw new Error('Select an item first')
      const response = await fetch(`/api/lost-and-found/${claimingItem.id}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claim)
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error?.[0]?.message || body.error || 'Please provide claim details')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lost-and-found'] })
      setClaimingItem(null)
      setClaim({ claimantName: '', claimantContact: '', proof: '' })
      toast({ title: 'Claim submitted', description: 'Your proof is pending review.' })
    },
    onError: (mutationError: Error) => toast({ title: 'Could not submit claim', description: mutationError.message, variant: 'destructive' })
  })

  const updateReport = (field: keyof typeof emptyReport, value: string) => {
    setReport((current) => ({ ...current, [field]: value }))
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-md border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-medium text-emerald-800">Campus help desk</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Lost & Found</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Report something missing, share something you found, and help return items to their owners.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
        <Card className="border-sky-200 bg-sky-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5 text-emerald-700" />Post a report</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
              <select value={report.type} onChange={(event) => updateReport('type', event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="found">I found an item</option>
                <option value="lost">I lost an item</option>
              </select>
              <Input value={report.title} onChange={(event) => updateReport('title', event.target.value)} placeholder="Item name" required />
              <Input value={report.category} onChange={(event) => updateReport('category', event.target.value)} placeholder="Category (ID card, bag, keys...)" required />
              <Textarea value={report.description} onChange={(event) => updateReport('description', event.target.value)} placeholder="Describe the item and any identifying details" required />
              <Input value={report.location} onChange={(event) => updateReport('location', event.target.value)} placeholder="Location (room, floor, or building)" required />
              <Input type="datetime-local" value={report.dateTime} onChange={(event) => updateReport('dateTime', event.target.value)} required />
              <Input value={report.reportedBy} onChange={(event) => updateReport('reportedBy', event.target.value)} placeholder={report.type === 'found' ? 'Your name' : 'Your name'} required />
              {report.type === 'found' && <Input value={report.foundByName} onChange={(event) => updateReport('foundByName', event.target.value)} placeholder="Name of the person who found it" required />}
              <Input value={report.contact} onChange={(event) => updateReport('contact', event.target.value)} placeholder="Contact details" required />
              <Button type="submit" className="w-full bg-emerald-700 text-white hover:bg-emerald-800" disabled={createMutation.isPending}>{createMutation.isPending ? 'Posting...' : 'Post report'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/70">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PackageSearch className="h-5 w-5 text-sky-700" />Recent reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="rounded-md bg-sky-50 p-4 text-sm text-slate-600">Loading reports...</p>}
            {error && <p className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">Could not load reports.</p>}
            {!isLoading && !error && items.length === 0 && <p className="rounded-md bg-slate-50 p-4 text-sm text-muted-foreground">No reports have been posted yet.</p>}
            {items.map((item) => (
              <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-medium ${item.type === 'found' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.type === 'found' ? 'Found' : 'Lost'}</span><span className="text-xs text-muted-foreground">{item.category}</span></div>
                    <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setClaimingItem(item)}>Claim item</Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-sky-700" />{item.location}</span>
                  <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-sky-700" />{format(new Date(item.dateTime), 'PPp')}</span>
                  <span>Reported by: {item.reportedBy}</span>
                  {item.foundByName && <span>Found by: {item.foundByName}</span>}
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(claimingItem)} onOpenChange={(open) => { if (!open) setClaimingItem(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" />Claim {claimingItem?.title}</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); claimMutation.mutate() }}>
            <p className="text-sm text-muted-foreground">Claims are reviewed before an item is handed over. Include details only the owner is likely to know.</p>
            <Input value={claim.claimantName} onChange={(event) => setClaim((current) => ({ ...current, claimantName: event.target.value }))} placeholder="Your name" required />
            <Input value={claim.claimantContact} onChange={(event) => setClaim((current) => ({ ...current, claimantContact: event.target.value }))} placeholder="Your contact details" required />
            <Textarea value={claim.proof} onChange={(event) => setClaim((current) => ({ ...current, proof: event.target.value }))} placeholder="Proof of ownership (unique marks, contents, serial number, or other details)" minLength={10} required />
            <Button type="submit" className="w-full bg-emerald-700 text-white hover:bg-emerald-800" disabled={claimMutation.isPending}>{claimMutation.isPending ? 'Submitting...' : 'Submit claim for review'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
