import InstanceSkel = require('../../../instance_skel')
import {
  CompanionActionEvent,
  CompanionActions,
  CompanionInputFieldNumber,
  CompanionInputFieldTextInput
} from '../../../instance_skel_types'
import { EmberClient, Model as EmberModel } from 'emberplus-connection'
import { EmberPlusConfig } from './config'

export enum ActionId {
  SetValueInt = 'setValueInt',
  SetValueReal = 'setValueReal',
  SetValueString = 'setValueString',
  SetValueBoolean = 'setValueBoolean',
  MatrixConnect = 'matrixConnect',
  MatrixDisconnect = 'matrixDisconnect',
  MatrixSetConnection = 'matrixSetConnection',
  Take = 'take',
  SetSelectedSource = 'setSelectedSource',
  SetSelectedTarget = 'setSelectedTarget'
}

const pathInput: CompanionInputFieldTextInput = {
  type: 'textinput',
  label: 'Path',
  id: 'path'
}
const matrixInputs: Array<CompanionInputFieldTextInput | CompanionInputFieldNumber> = [
  pathInput,
  {
    type: 'number',
    label: 'Target',
    id: 'target',
    required: true,
    min: 0,
    max: 0xffffffff,
    default: 0,
    step: 1
  },
  {
    type: 'textinput',
    label: 'Sources',
    id: 'sources',
    regex: '/^((\\s*\\d+,)*(\\s*\\d+)$)|$/' // comma separated list
  }
]

const setValue = (self: InstanceSkel<EmberPlusConfig>, emberClient: EmberClient, type: EmberModel.ParameterType) => (
  action: CompanionActionEvent
): void => {
  emberClient.getElementByPath(action.options['path'] as string).then(node => {
    // TODO - do we handle not found?
    if (node && node.contents.type === EmberModel.ElementType.Parameter) {
      if (node.contents.parameterType === type) {
        self.debug('Got node on ' + action.options['path'])
        emberClient.setValue(
          node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
          action.options['value'] as number,
          false
        )
      } else {
        self.log('warn', 'Node ' + action.options['path'] + ' is not of type ' + type)
      }
    } else {
      self.log('warn', 'Parameter ' + action.options['path'] + ' not found or not a parameter')
    }
  })
}

const doMatrixActionFunction = function(
  self: InstanceSkel<EmberPlusConfig>,
  emberClient: EmberClient,
  selMatrix: number
) {
  if (
    self.config.selectedSource &&
    self.config.selectedDestination &&
    self.config.matrices &&
    self.config.selectedSource[selMatrix] != -1 &&
    self.config.selectedDestination[selMatrix] != -1
  ) {
    self.debug('Get node ' + self.config.matrices[selMatrix])
    emberClient.getElementByPath(self.config.matrices[selMatrix]).then(node => {
      // TODO - do we handle not found?
      if (node && node.contents.type === EmberModel.ElementType.Matrix) {
        self.debug('Got node on ' + selMatrix)
        // @ts-ignore
        const target = self.config.selectedDestination[selMatrix]
        // @ts-ignore
        const sources = [self.config.selectedSource[selMatrix]]
        emberClient.matrixConnect(node as EmberModel.NumberedTreeNode<EmberModel.Matrix>, target, sources)
      } else {
        self.log('warn', 'Matrix ' + selMatrix + ' not found or not a parameter')
      }
    })
  }
}

const doMatrixAction = (
  self: InstanceSkel<EmberPlusConfig>,
  emberClient: EmberClient,
  method: EmberClient['matrixConnect'] | EmberClient['matrixDisconnect'] | EmberClient['matrixSetConnection']
) => (action: CompanionActionEvent): void => {
  self.debug('Get node ' + action.options['path'])
  emberClient.getElementByPath(action.options['path'] as string).then(node => {
    // TODO - do we handle not found?
    if (node && node.contents.type === EmberModel.ElementType.Matrix) {
      self.debug('Got node on ' + action.options['path'])
      const target = Number(action.options['target'])
      const sources = (action.options['sources'] as string)
        .split(',')
        .filter(v => v !== '')
        .map(s => Number(s))
      method(node as EmberModel.NumberedTreeNode<EmberModel.Matrix>, target, sources)
    } else {
      self.log('warn', 'Matrix ' + action.options['path'] + ' not found or not a parameter')
    }
  })
}

const doTake = (self: InstanceSkel<EmberPlusConfig>, emberClient: EmberClient) => (
  action: CompanionActionEvent
): void => {
  if (self.config.selectedDestination && self.config.selectedSource && self.config.matrices) {
    if (
      self.config.selectedDestination[Number(action.options['matrix'])] != -1 &&
      self.config.selectedSource[Number(action.options['matrix'])] != -1
    ) {
      doMatrixActionFunction(self, emberClient, Number(action.options['matrix']))
    } else {
      self.log('debug', 'TAKE went wrong.')
    }
    self.log(
      'debug',
      'TAKE: selectedDest: ' +
        self.config.selectedDestination[Number(action.options['matrix'])] +
        ' selectedSource: ' +
        self.config.selectedSource[Number(action.options['matrix'])] +
        ' on matrix ' +
        Number(action.options['matrix'])
    )
  }
}

const setSelectedSource = (self: InstanceSkel<EmberPlusConfig>, emberClient: EmberClient) => (
  action: CompanionActionEvent
): void => {
  if (action.options['source'] != -1 && action.options['matrix'] != -1 && self.config.selectedSource) {
    self.config.selectedSource[Number(action.options['matrix'])] = Number(action.options['source'])
  }
  self.log('debug', 'Take is: ' + self.config.take)
  if (self.config.take) doMatrixActionFunction(self, emberClient, Number(action.options['matrix']))
  self.log('debug', 'setSelectedSource: ' + action.options['source'] + ' on Matrix: ' + action.options['matrix'])
}

const setSelectedTarget = (self: InstanceSkel<EmberPlusConfig>) => (action: CompanionActionEvent): void => {
  if (action.options['target'] != -1 && action.options['matrix'] != -1 && self.config.selectedDestination) {
    self.config.selectedDestination[Number(action.options['matrix'])] = Number(action.options['target'])
  }

  self.log('debug', 'setSelectedTarget: ' + action.options['target'] + ' on Matrix: ' + action.options['matrix'])
}

export function GetActionsList(self: InstanceSkel<EmberPlusConfig>, emberClient: EmberClient): CompanionActions {
  return {
    [ActionId.SetValueInt]: {
      label: 'Set Value Integer',
      options: [
        pathInput as CompanionInputFieldTextInput,
        {
          type: 'number',
          label: 'Value',
          id: 'value',
          required: true,
          min: -0xffffffff,
          max: 0xffffffff,
          default: 0,
          step: 1
        }
      ],
      callback: setValue(self, emberClient, EmberModel.ParameterType.Integer)
    },
    [ActionId.SetValueReal]: {
      label: 'Set Value Real',
      options: [
        pathInput as CompanionInputFieldTextInput,
        {
          type: 'number',
          label: 'Value',
          id: 'value',
          required: true,
          min: -0xffffffff,
          max: 0xffffffff,
          default: 0,
          step: 0.001 // TODO - don't want this at all preferably
        }
      ],
      callback: setValue(self, emberClient, EmberModel.ParameterType.Real)
    },
    [ActionId.SetValueBoolean]: {
      label: 'Set Value Boolean',
      options: [
        pathInput as CompanionInputFieldTextInput,
        {
          type: 'checkbox',
          label: 'Value',
          id: 'value',
          default: false
        }
      ],
      callback: setValue(self, emberClient, EmberModel.ParameterType.Boolean)
    },
    [ActionId.SetValueString]: {
      label: 'Set Value String',
      options: [
        pathInput as CompanionInputFieldTextInput,
        {
          type: 'textinput',
          label: 'Value',
          id: 'value'
        }
      ],
      callback: setValue(self, emberClient, EmberModel.ParameterType.String)
    },
    [ActionId.MatrixConnect]: {
      label: 'Matrix Connect',
      options: [...matrixInputs],
      callback: doMatrixAction(self, emberClient, (...args) => emberClient.matrixConnect(...args))
    },
    [ActionId.MatrixDisconnect]: {
      label: 'Matrix Disconnect',
      options: [...matrixInputs],
      callback: doMatrixAction(self, emberClient, (...args) => emberClient.matrixDisconnect(...args))
    },
    [ActionId.MatrixSetConnection]: {
      label: 'Matrix Set Connection',
      options: [...matrixInputs],
      callback: doMatrixAction(self, emberClient, (...args) => emberClient.matrixSetConnection(...args))
    },
    [ActionId.Take]: {
      label: 'Take',
      options: [
        {
          type: 'number',
          label: 'Matrix Number',
          id: 'matrix',
          required: true,
          min: 0,
          max: 0xffffffff,
          default: 0
        }
      ],
      callback: doTake(self, emberClient)
    },
    [ActionId.SetSelectedSource]: {
      label: 'Set Selected Source',
      options: [
        {
          type: 'number',
          label: 'Select Matrix Number',
          id: 'matrix',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        },
        {
          type: 'number',
          label: 'Value',
          id: 'source',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        }
      ],
      callback: setSelectedSource(self, emberClient)
    },
    [ActionId.SetSelectedTarget]: {
      label: 'Set Selected Target',
      options: [
        {
          type: 'number',
          label: 'Select Matrix Number',
          id: 'matrix',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        },
        {
          type: 'number',
          label: 'Value',
          id: 'target',
          required: true,
          min: -0,
          max: 0xffffffff,
          default: 0
        }
      ],
      callback: setSelectedTarget(self)
    }
  }
}
