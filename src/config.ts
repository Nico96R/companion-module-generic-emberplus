import InstanceSkel = require('../../../instance_skel')
import { SomeCompanionConfigField } from '../../../instance_skel_types'

export const portDefault = 9000

export interface EmberPlusConfig {
  host?: string
  port?: number
  take?: boolean
  inputCount: number
  outputCount: number
  selectedSource: number
  selectedDestination: number
  selectedMatrix: string
  matrices: string[]
  matricesString: string
}

export function GetConfigFields(self: InstanceSkel<EmberPlusConfig>): SomeCompanionConfigField[] {
  return [
    {
      type: 'textinput',
      id: 'host',
      label: 'Target IP',
      tooltip: 'The IP of the ember+ provider',
      width: 6,
      regex: self.REGEX_IP
    },
    {
      type: 'number',
      id: 'port',
      label: 'Target Port',
      tooltip: 'Usually 9000 by default',
      width: 6,
      min: 1,
      max: 0xffff,
      step: 1,
      default: portDefault
    },
    {
      type: 'checkbox',
      id: 'take',
      label: 'Enable Take? (XY only)',
      width: 6,
      default: false,
    },
    {
      type: 'textinput',
      id: 'matricesString',
      label: 'Paths to matrices',
      tooltip: 'Please seperate by comma',
      width: 12
    },
    {
      type: 'number',
      id: 'inputCount',
      label: 'Number of Inputs',
      tooltip: 'Used, when there is no connection',
      width: 6,
      min: 1,
      max: 65536,
      default: 12,
      required: true
    },
    {
      type: 'number',
      id: 'outputCount',
      label: 'Number of Inputs',
      tooltip: 'Used, when there is no connection',
      width: 6,
      min: 1,
      max: 65536,
      default: 12,
      required: true
    }
  ]
}
