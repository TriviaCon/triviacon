import { IpcMain, IpcRenderer } from 'electron'
import db from './db'

export const dbg = console.log

const open = async (test: string): Promise<string> => {
  console.log('open called on main', test)
  return 'TODO'
}

const handlers = {
  open,
  db
} as const

export const registerIpcHandlers = (ipc: IpcMain, handlersMap = handlers, base = '') => {
  for (const [name, handler] of Object.entries(handlersMap)) {
    const ipcName = `${base}.${name}`
    if (typeof handler === 'function') {
      dbg('\t'.repeat(ipcName.split('.').length - 1) + 'Register IPC handler', ipcName)
      ipc.handle(ipcName, (_, ...args) => handler.call(this, ...args.flat()))
    } else if (typeof handler === 'object') {
      registerIpcHandlers(ipc, handler, ipcName)
    }
  }
}

export const initRendererIpc = (
  ipc: IpcRenderer,
  handlersMap = handlers,
  base = ''
): typeof handlers => {
  let _handlers = {}
  for (const [name, handler] of Object.entries(handlersMap)) {
    const ipcName = `${base}.${name}`
    if (typeof handler === 'function') {
      _handlers[name] = (...args) => {
        dbg('IPC invoke', ipcName, args)
        return ipc.invoke(ipcName, args)
      }
    } else if (typeof handler === 'object') {
      // @ts-expect-error no time for types
      _handlers = { ..._handlers, [name]: initRendererIpc(ipc, handler, ipcName) }
    }
  }
  return _handlers as typeof handlers
}
