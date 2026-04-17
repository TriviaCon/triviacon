import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Play, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import ActionBar from './ActionBar'
import { BuilderView } from '../builder/BuilderView'
import { RunnerView } from '../runner/RunnerView'
import { SettingsView } from '../settings/SettingsView'

const ControlView = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('builder')

  return (
    <div className="flex flex-col">
      <Tabs defaultValue="builder" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">
            <Pencil className="mr-1 h-4 w-4" /> {t('tabs.builder')}
          </TabsTrigger>
          <TabsTrigger value="game-runner">
            <Play className="mr-1 h-4 w-4" /> {t('tabs.runner')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 h-4 w-4" /> {t('tabs.settings')}
          </TabsTrigger>
        </TabsList>
        {activeTab !== 'settings' && <ActionBar activeTab={activeTab} />}
        <TabsContent value="builder">
          <BuilderView />
        </TabsContent>
        <TabsContent value="game-runner">
          <RunnerView />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ControlView
