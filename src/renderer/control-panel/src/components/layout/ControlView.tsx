import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Play, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import ActionBar from './ActionBar'
import { BuilderView } from '../builder/BuilderView'
import { RunnerView } from '../runner/RunnerView'
import { RunnerTimer } from '../runner/RunnerTimer'
import { SettingsView } from '../settings/SettingsView'

const ControlView = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('builder')

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <Tabs defaultValue="builder" onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Toolbar zone: tab switcher + action bar on the left, timer flush right */}
        <div className="flex items-stretch shrink-0 border-b border-border">
          <div className="flex-1 min-w-0 flex flex-col">
            <TabsList className="border-b-0">
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
          </div>
          {activeTab === 'game-runner' && <RunnerTimer />}
        </div>

        <TabsContent value="builder" className="flex-1 min-h-0 overflow-hidden">
          <BuilderView />
        </TabsContent>
        <TabsContent value="game-runner" className="flex-1 min-h-0 overflow-hidden">
          <RunnerView />
        </TabsContent>
        <TabsContent value="settings" className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            <SettingsView />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ControlView
