import InstanceSkel = require('../../../instance_skel')
import { CompanionConfigField, CompanionSystem } from '../../../instance_skel_types'
import { GetActionsList } from './actions'
import { EmberPlusConfig, GetConfigFields } from './config'
import { GetFeedbacksList } from './feedback'
import { EmberClient } from 'emberplus-connection' // note - emberplus-conn is in parent repo, not sure if it needs to be defined as dependency

/**
 * Companion instance class for an generic ember+ Provider.
 */
class EmberPlusInstance extends InstanceSkel<EmberPlusConfig> {
  private emberClient: EmberClient

  /**
   * Create an instance of an EmberPlus module.
   */
  constructor(system: CompanionSystem, id: string, config: EmberPlusConfig) {
    super(system, id, config)

    this.emberClient = new EmberClient(config.host || '', config.port)

    this.config.selectedSource = []
    this.config.selectedDestination = []

    if (config.matricesString) {
      this.config.matrices = config.matricesString.split(',')
    }
    if (config.inputCountString) this.config.inputCount = config.inputCountString.split(',').map(Number)

    if (config.outputCountString) this.config.outputCount = config.outputCountString.split(',').map(Number)

    this.updateCompanionBits()
    this.setupChoices()
  }

  // Override base types to make types stricter
  public checkFeedbacks(...feedbackTypes: string[]): void {
    // todo - arg should be of type FeedbackId
    super.checkFeedbacks(...feedbackTypes)
  }

  /**
   * Main initialization function called once the module
   * is OK to start doing things.
   */
  public init(): void {
    this.status(this.STATUS_UNKNOWN)
    this.setupEmberConnection()
    this.setupChoices()

    this.updateCompanionBits()
  }

  /**
   * Process an updated configuration array.
   */
  public updateConfig(config: EmberPlusConfig): void {
    this.config = config

    this.emberClient.disconnect().then(() => {
      if (config.matricesString) {
        this.config.matrices = config.matricesString.split(',')
      }
      this.log('debug', 'Entered matrices: ' + config.matricesString)

      this.setupEmberConnection()
      this.setupChoices()
    })
  }

  /**
   * Creates the configuration fields for web config.
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  public config_fields(): CompanionConfigField[] {
    return GetConfigFields(this)
  }

  /**
   * Clean up the instance before it is destroyed.
   */
  public destroy(): void {
    this.emberClient.discard()
    this.emberClient.disconnect()

    this.debug('destroy', this.id)
  }

  private updateCompanionBits(): void {
    this.setActions(GetActionsList(this, this.client))
    this.setFeedbackDefinitions(GetFeedbacksList(this, this.client))
  }

  private get client(): EmberClient {
    return this.emberClient
  }

  private setupEmberConnection(): void {
    this.log('debug', 'connecting ' + (this.config.host || '') + ':' + this.config.port)
    this.status(this.STATUS_WARNING, 'Connecting')

    this.emberClient = new EmberClient(this.config.host || '', this.config.port)
    this.emberClient.on('error', e => {
      this.log('error', 'Error ' + e)
    })
    this.emberClient.on('connected', () => {
      this.emberClient.getDirectory(this.emberClient.tree) // get root
      this.status(this.STATUS_OK, 'Connected')
    })
    this.emberClient.on('disconnected', () => {
      this.status(this.STATUS_WARNING, 'Reconnecting')
    })
    this.emberClient
      .connect()
      .then(r => {
        if (r) {
          this.log('debug', r.toString())
        }
      })
      .then(() => {
        this.log('debug', 'emberplus opened socket.')
      })
  }

  private setupChoices(): void {
    if (this.config.selectedSource) {
      for (let i = 0; i < this.config.selectedSource.length; i++) {
        this.config.selectedSource[i] = -1
      }
    }
    if (this.config.selectedDestination) {
      for (let i = 0; i < this.config.selectedDestination.length; i++) {
        this.config.selectedDestination[i] = -1
      }
    }

    /*
    if (this.config.inputCount && this.config.matrices) {
      this.config.CHOICES_INPUTS = []
      for (let i = 0; i < this.config.inputCount.length; i++) {
        this.config.CHOICES_INPUTS.push()
        for (let j = 0; i < this.config.inputCount[i]; i++) {
          //TODO: durch Matrix Feedback dynamisch befüllen.
          this.config.CHOICES_INPUTS[i][j] = j
        }
      }

    }
    if (this.config.outputCount && this.config.matrices) {
      this.config.CHOICES_OUTPUTS = new Array(this.config.outputCount.length)
      for (let i = 0; i < this.config.outputCount.length; i++) {
        for (let j = 0; i < this.config.outputCount[i]; i++) {
          //TODO: durch Matrix Feedback dynamisch befüllen.
          this.config.CHOICES_OUTPUTS[i].push(j)
        }
      }
    }
     */
  }
}

export = EmberPlusInstance
