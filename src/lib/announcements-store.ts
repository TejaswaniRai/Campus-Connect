import { Announcement } from '@/types/index'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

const DATA_DIRECTORY = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), 'data')
const ANNOUNCEMENTS_FILE = path.join(DATA_DIRECTORY, 'announcements.json')

class FileBasedAnnouncementsStore {
  announcements: Announcement[] = []

  constructor() {
    this.initialize()
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(ANNOUNCEMENTS_FILE)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
        const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8')
        this.announcements = JSON.parse(data)
      } else {
        this.announcements = []
        this.save()
      }
    } catch (error) {
      console.error('Error initializing announcements store:', error)
      this.announcements = []
    }
  }

  async save(): Promise<void> {
    try {
      fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(this.announcements, null, 2))
    } catch (error) {
      console.error('Error saving announcements:', error)
    }
  }

  async getAll(): Promise<Announcement[]> {
    return [...this.announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async getById(id: string): Promise<Announcement | undefined> {
    return this.announcements.find(ann => ann.id === id)
  }

  async add(announcementData: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
    const announcement: Announcement = {
      ...announcementData,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    }

    this.announcements.push(announcement)
    await this.save()
    return announcement
  }

  async update(id: string, announcementData: Partial<Omit<Announcement, 'id' | 'createdAt'>>): Promise<Announcement | undefined> {
    const index = this.announcements.findIndex(ann => ann.id === id)
    if (index === -1) return undefined

    this.announcements[index] = {
      ...this.announcements[index],
      ...announcementData
    }

    await this.save()
    return this.announcements[index]
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.announcements.length
    this.announcements = this.announcements.filter(ann => ann.id !== id)
    await this.save()
    return initialLength > this.announcements.length
  }
}

export const announcementsStore = new FileBasedAnnouncementsStore()
