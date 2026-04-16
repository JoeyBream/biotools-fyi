import Hero from '@/components/Hero'
import Dashboard from '@/components/Dashboard'
import tools from '@/data/tools.json'
import type { Tool } from '@/lib/types'

export default function Home() {
  return (
    <>
      <Hero />
      <Dashboard tools={tools as Tool[]} />
    </>
  )
}
