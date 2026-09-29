'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, Eye } from 'lucide-react'
import { StudyMaterialList } from '@/components/ui/study-material-list'
import { Input } from '@/components/ui/input'
// import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function StudentStudyMaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterType, setFilterType] = useState('all')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-purple-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Study Materials</h1>
          <p className="text-white/70">
            Access and download your course materials, assignments, and resources
          </p>
        </div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder="Search study materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10 bg-white border-slate-300 text-foreground placeholder:text-slate-500 focus:border-emerald-600 focus:ring-emerald-100"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Study Materials List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="p-6 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm"
        >
          <StudyMaterialList isAdmin={false} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
            <Download className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white">Easy Download</h3>
            <p className="text-white/60 text-sm">One-click download for all materials</p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
            <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white">Preview Files</h3>
            <p className="text-white/60 text-sm">View PDFs and images before downloading</p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
            <Filter className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white">Smart Filtering</h3>
            <p className="text-white/60 text-sm">Find materials by subject and type</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}