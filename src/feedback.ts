import { CompanionFeedback, CompanionFeedbackAdvanced, CompanionFeedbacks } from '../../../instance_skel_types'
import InstanceSkel = require('../../../instance_skel')
import { EmberPlusConfig } from './config'
import { EmberClient } from 'emberplus-connection'

type CompanionFeedbackWithCallback =
  | CompanionFeedback
  | (CompanionFeedbackAdvanced & Required<Pick<CompanionFeedback, 'callback' | 'subscribe' | 'unsubscribe'>>)

export enum FeedbackId {
  SourceBackgroundSelected = 'sourceBackgroundSelected',
  TargetBackgroundSelected = 'targetBackgroundSelected'
}

export function GetFeedbacksList(_self: InstanceSkel<EmberPlusConfig>, _emberClient: EmberClient): CompanionFeedbacks {
  const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
    [FeedbackId.SourceBackgroundSelected]: {
      label: 'Source Background If Selected',
      description: 'Change Background of Source, when it is currently selected.',
      options: [
        {
          type: 'colorpicker',
          label: 'Foreground color',
          id: 'fg',
          default: _self.rgb(0, 0, 0)
        },
        {
          type: 'colorpicker',
          label: 'Background color',
          id: 'bg',
          default: _self.rgb(0, 255, 0)
        },
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
      callback: (feedback, bank) => {
        if (_self.config.selectedSource[Number(feedback.options['matrix'])] == feedback.options['source']) {
          return {
            color: Number(feedback.options.fg),
            bgcolor: Number(feedback.options.bg)
          }
        } else
          return {
            // @ts-ignore
            color: bank.color,
            // @ts-ignore
            bgcolor: bank.bgcolor
          }
      }
    },
    [FeedbackId.TargetBackgroundSelected]: {
      label: 'Target Background if Selected',
      description: 'Change Background of Target, when it is currently selected.',
      options: [
        {
          type: 'colorpicker',
          label: 'Foreground color',
          id: 'fg',
          default: _self.rgb(0, 0, 0)
        },
        {
          type: 'colorpicker',
          label: 'Background color',
          id: 'bg',
          default: _self.rgb(0, 255, 0)
        },
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
      callback: (feedback, bank) => {
        if (_self.config.selectedDestination[Number(feedback.options['matrix'])] == feedback.options['target']) {
          return {
            color: Number(feedback.options.fg),
            bgcolor: Number(feedback.options.bg)
          }
        } else
          return {
            // @ts-ignore
            color: bank.color,
            // @ts-ignore
            bgcolor: bank.bgcolor
          }
      }
    }
  }

  return feedbacks
}
