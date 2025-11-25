import React from 'react'
import { Wrench } from 'lucide-react'
import asanaPng from '../assets/asana.png'
import slackPng from '../assets/slack.png'
import GithubPng from '../assets/github.png'
import AirtablePng from '../assets/airtable.png'
import AmplitudePng from '../assets/amplitude.png'
import dropBoxPng from '../assets/dropbox.png'
import confluencePng from '../assets/confluence.png'
import LinearPng from '../assets/linear.png'
import NotionPng from '../assets/notion.png'
import JiraPng from '../assets/jira.png'
import BambooHRPng from '../assets/bamboohr.png'
import NewRelicPng from '../assets/newrelic.png'
import DatadogPng from '../assets/datadog.png'
import FirefliesPng from '../assets/fireflies.png'
import FreshdeskPng from '../assets/freshdesk.png'
import FreshchatPng from '../assets/freshchat.png'
import GoogleCalendarPng from '../assets/gCalendar.png'
import GoogleDrivePng from '../assets/gdrive.png'
import GmailPng from '../assets/gmail.png'
import GoogleDocsPng from '../assets/gdocs.png'
import GoogleSheetsPng from '../assets/gsheets.png'
import GoogleSlidesPng from '../assets/gslides.png'
import HubspotPng from '../assets/hubspot.png'
import MySQLPng from '../assets/mysql.png'
import PostgresPng from '../assets/postgres.png'
import SalesforcePng from '../assets/salesforce.png'
import PipedrivePng from '../assets/pipedrive.png'
import StripePng from '../assets/stripe.png'
import ZendeskPng from '../assets/zendesk.png'
import SentryPng from '../assets/sentry.png'
import DiscordPng from '../assets/discord.png'

const connectorIconMap: Record<string, string> = {
  github: GithubPng,
  asana: asanaPng,
  slack: slackPng,
  airtable: AirtablePng,
  amplitude: AmplitudePng,
  bamboohr: BambooHRPng,
  confluence: confluencePng,
  googleCalendar: GoogleCalendarPng,
  googleDrive: GoogleDrivePng,
  googleGmail: GmailPng,
  hubspot: HubspotPng,
  jira: JiraPng,
  linear: LinearPng,
  newrelic: NewRelicPng,
  notion: NotionPng,
  pipedrive: PipedrivePng,
  salesforce: SalesforcePng,
  zendesk: ZendeskPng,
  dropbox: dropBoxPng,
  discord: DiscordPng,
  freshchat: FreshchatPng,
  freshdesk: FreshdeskPng,
  fireflies: FirefliesPng,
  sentry: SentryPng,
  stripe: StripePng,
  datadog: DatadogPng,
  mysql: MySQLPng,
  postgres: PostgresPng,
  postgresql: PostgresPng,
}

let toolToConnectorMap: Record<string, string> = {}

function getSpecialIcon(toolName: string): string | null {
  const lower = toolName.toLowerCase()
  
  if (lower.includes('sheet') || lower.includes('spreadsheet')) {
    return GoogleSheetsPng
  }
  
  if (lower.includes('doc') && !lower.includes('docker')) {
    return GoogleDocsPng
  }
  
  if (lower.includes('slide') || lower.includes('presentation')) {
    return GoogleSlidesPng
  }
  
  return null
}

export class ToolIconRegistry {
  static buildToolMap(connectorsMeta: Array<{ type: string; tools: string[] }>) {
    const map: Record<string, string> = {}
    
    for (const connector of connectorsMeta) {
      for (const tool of connector.tools || []) {
        map[tool.toLowerCase()] = connector.type
      }
    }
    
    toolToConnectorMap = map
  }

  static getToolIcon(toolName: string): string | React.ComponentType<{ className?: string }> {
    if (!toolName) {
      return Wrench
    }

    const lowerToolName = toolName.toLowerCase()
    
    const specialIcon = getSpecialIcon(lowerToolName)
    if (specialIcon) {
      return specialIcon
    }

    const connectorType = toolToConnectorMap[lowerToolName]
    
    if (connectorType && connectorIconMap[connectorType]) {
      return connectorIconMap[connectorType]
    }

    return Wrench
  }

  static isImageIcon(icon: string | React.ComponentType<{ className?: string }>): icon is string {
    return typeof icon === 'string'
  }

  static registerConnectorIcon(connectorName: string, iconPath: string) {
    connectorIconMap[connectorName] = iconPath
  }
}
