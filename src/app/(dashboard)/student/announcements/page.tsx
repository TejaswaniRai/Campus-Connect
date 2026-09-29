'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Calendar, FileText, Clock, MessageSquare, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import type { Announcement } from '@/types/index'

// Fetch announcements
async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch('/api/announcements')
  if (!response.ok) throw new Error('Failed to fetch announcements')
  return response.json()
}

export default function StudentAnnouncementsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
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

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: async ({ announcementId, content }: { announcementId: string; content: string }) => {
      const response = await fetch(`/api/announcements/${announcementId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          author: 'student',
          authorName: 'Student' // In a real app, this would come from user context
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
        <div className="mx-auto max-w-4xl rounded-md border border-sky-200 bg-sky-50 p-6 text-center text-sm text-slate-600">
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          <p className="text-white/60 mt-2">Stay updated with the latest news and important information</p>
          <div className="flex items-center justify-center mt-4 text-sm text-white/40">
            <Clock className="w-4 h-4 mr-2" />
            <span>Updates automatically every 5 seconds</span>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No announcements yet</h3>
                <p className="text-white/60">Check back later for updates</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600/20 p-2 rounded-full">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-xl">{announcement.title}</CardTitle>
                          <p className="text-white/60 text-sm flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(announcement.date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                        {format(new Date(announcement.createdAt), 'MMM d')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white/80 leading-relaxed whitespace-pre-wrap mb-3">
                      {announcement.description}
                    </div>
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
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {announcements.length > 0 && (
          <div className="text-center text-white/40 text-sm">
            <p>Showing {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </div>
  )
}
