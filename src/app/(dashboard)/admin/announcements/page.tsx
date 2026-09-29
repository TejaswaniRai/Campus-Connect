'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Plus, Edit, Trash2, Calendar, FileText, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import type { Announcement } from '@/types/index'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  teacherName: z.string().optional(),
  batchName: z.string().optional()
})

type AnnouncementForm = z.infer<typeof announcementSchema>

// Fetch announcements
async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch('/api/announcements')
  if (!response.ok) throw new Error('Failed to fetch announcements')
  return response.json()
}

// Create announcement
async function createAnnouncement(data: AnnouncementForm): Promise<Announcement> {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create announcement')
  }
  return response.json()
}

// Update announcement
async function updateAnnouncement(id: string, data: Partial<AnnouncementForm>): Promise<Announcement> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update announcement')
  }
  return response.json()
}

// Delete announcement
async function deleteAnnouncement(id: string): Promise<void> {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete announcement')
  }
}

export default function AdminAnnouncementsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [previousAnnouncements, setPreviousAnnouncements] = useState<Announcement[]>([])
  const [hasShownInitialLoad, setHasShownInitialLoad] = useState(false)

  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
    refetchInterval: 5000 // Poll every 5 seconds for real-time updates
  })

  // Show notifications for new announcements or replies
  React.useEffect(() => {
    if (announcements.length > 0 && previousAnnouncements.length > 0 && hasShownInitialLoad) {
      // Check for new announcements
      const newAnnouncements = announcements.filter(
        ann => !previousAnnouncements.some(prev => prev.id === ann.id)
      )

      newAnnouncements.forEach(announcement => {
        toast({
          title: "New Announcement",
          description: `"${announcement.title}" has been posted`,
          duration: 5000,
        })
      })

      // Check for new replies
      announcements.forEach(currentAnn => {
        const previousAnn = previousAnnouncements.find(prev => prev.id === currentAnn.id)
        if (previousAnn && currentAnn.replies && previousAnn.replies) {
          const newReplies = currentAnn.replies.filter(
            reply => !previousAnn.replies!.some(prevReply => prevReply.id === reply.id)
          )

          newReplies.forEach(reply => {
            toast({
              title: "New Reply",
              description: `${reply.authorName} replied to "${currentAnn.title}"`,
              duration: 5000,
            })
          })
        }
      })
    }

    if (announcements.length > 0 && !hasShownInitialLoad) {
      setHasShownInitialLoad(true)
    }

    setPreviousAnnouncements(announcements)
  }, [announcements, previousAnnouncements, hasShownInitialLoad, toast])

  const createForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    }
  })

  const editForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema)
  })

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setIsCreateDialogOpen(false)
      createForm.reset()
      toast({
        title: 'Success',
        description: 'Announcement created successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnouncementForm> }) =>
      updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setEditingAnnouncement(null)
      editForm.reset()
      toast({
        title: 'Success',
        description: 'Announcement updated successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const onCreateSubmit = (data: AnnouncementForm) => {
    createMutation.mutate(data)
  }

  const onEditSubmit = (data: AnnouncementForm) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data })
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    editForm.reset({
      title: announcement.title,
      description: announcement.description,
      date: announcement.date.split('T')[0],
      teacherName: announcement.teacherName || '',
      batchName: announcement.batchName || ''
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id)
    }
  }

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: async ({ announcementId, content }: { announcementId: string; content: string }) => {
      const response = await fetch(`/api/announcements/${announcementId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          author: 'admin',
          authorName: 'Administrator' // In a real app, this would come from user context
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add reply')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setReplyingTo(null)
      setReplyContent('')
      toast({
        title: 'Success',
        description: 'Reply sent successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleReply = (announcementId: string) => {
    if (replyContent.trim()) {
      addReplyMutation.mutate({ announcementId, content: replyContent.trim() })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl rounded-md border border-sky-200 bg-sky-50 p-6 text-center text-sm text-slate-600">
          Loading announcements...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 p-6">
        <div className="text-center text-white">
          Error loading announcements: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Announcements Management</h1>
            <p className="text-white/60 mt-2">Create and manage announcements for students</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="teacherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher Name (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="batchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Name (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcements List */}
        <div className="grid gap-6">
          {announcements.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No announcements yet</h3>
                <p className="text-white/60">Create your first announcement to get started</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="bg-white/10 border-white/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-white/60" />
                      <div>
                        <CardTitle className="text-white">{announcement.title}</CardTitle>
                        <p className="text-white/60 text-sm">
                          {format(new Date(announcement.date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        className="text-blue-400 p-2 h-8 w-8"
                        title="Edit announcement"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-400 p-2 h-8 w-8"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 mb-3">{announcement.description}</p>
                  {(announcement.teacherName || announcement.batchName) && (
                    <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-4">
                      {announcement.teacherName && (
                        <div className="flex items-center">
                          <span className="font-medium">Teacher:</span>
                          <span className="ml-1">{announcement.teacherName}</span>
                        </div>
                      )}
                      {announcement.batchName && (
                        <div className="flex items-center">
                          <span className="font-medium">Batch:</span>
                          <span className="ml-1">{announcement.batchName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Button */}
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === announcement.id ? null : announcement.id)}
                      className="text-green-400 px-3 py-2 h-auto"
                      title="Reply to this announcement"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Reply</span>
                    </Button>
                    {announcement.replies && announcement.replies.length > 0 && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-white/5 rounded-full">
                        <MessageSquare className="w-3 h-3 text-white/60" />
                        <span className="text-xs text-white/60 font-medium">
                          {announcement.replies.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === announcement.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="mb-3 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent('')
                          }}
                          className="text-gray-400 px-4 py-2 h-auto"
                          title="Cancel reply"
                        >
                          <span className="text-sm font-medium">Cancel</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReply(announcement.id)}
                          disabled={!replyContent.trim() || addReplyMutation.isPending}
                          className="bg-green-600 px-4 py-2 h-auto"
                          title="Send your reply"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            {addReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
                          </span>
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Display Replies */}
                  {announcement.replies && announcement.replies.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white/80">Replies:</h4>
                      {announcement.replies.map((reply) => (
                        <div key={reply.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                reply.author === 'student' ? 'bg-blue-400' :
                                reply.author === 'faculty' ? 'bg-green-400' : 'bg-purple-400'
                              }`} />
                              <span className="text-sm font-medium text-white/80">
                                {reply.authorName}
                              </span>
                              <span className="text-xs text-white/40">
                                ({reply.author})
                              </span>
                            </div>
                            <span className="text-xs text-white/40">
                              {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="teacherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="batchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingAnnouncement(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
