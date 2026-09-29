import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { LostFoundClaim, LostFoundItem } from '@/types'

const DATA_DIRECTORY = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), 'data')
const LOST_FOUND_FILE = path.join(DATA_DIRECTORY, 'lost-and-found.json')

class FileBasedLostFoundStore {
  items: LostFoundItem[] = []

  constructor() {
    this.initialize()
  }

  private initialize() {
    try {
      const dataDir = path.dirname(LOST_FOUND_FILE)
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
      if (fs.existsSync(LOST_FOUND_FILE)) {
        this.items = JSON.parse(fs.readFileSync(LOST_FOUND_FILE, 'utf-8'))
      } else {
        this.save()
      }
    } catch (error) {
      console.error('Error initializing lost and found store:', error)
      this.items = []
    }
  }

  private async save() {
    try {
      fs.writeFileSync(LOST_FOUND_FILE, JSON.stringify(this.items, null, 2))
    } catch (error) {
      console.warn('Lost and found data is available in memory only:', error)
    }
  }

  async getAll() {
    return [...this.items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async add(itemData: Omit<LostFoundItem, 'id' | 'createdAt' | 'claims'>) {
    const item: LostFoundItem = {
      ...itemData,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      claims: []
    }
    this.items.push(item)
    await this.save()
    return item
  }

  async addClaim(itemId: string, claimData: Omit<LostFoundClaim, 'id' | 'createdAt' | 'status'>) {
    const item = this.items.find((entry) => entry.id === itemId)
    if (!item) return undefined

    const claim: LostFoundClaim = {
      ...claimData,
      id: randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    item.claims.push(claim)
    await this.save()
    return claim
  }
}

export const lostAndFoundStore = new FileBasedLostFoundStore()
