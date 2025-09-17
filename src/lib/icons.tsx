import React from "react"
import asanaPng from '../assets/asana.png'
import slackPng from '../assets/slack.png'
import GithubPng from '../assets/github.png'
import AirtablePng from '../assets/airtable.png'
import AmplitudePng from '../assets/amplitude.png'
import dropBoxPng from "../assets/dropbox.png"
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
import HubspotPng from '../assets/hubspot.png'
import MySQLPng from '../assets/mysql.png'
import PostgresPng from '../assets/postgres.png'
import SalesforcePng from '../assets/salesforce.png'
import PipedrivePng from '../assets/pipedrive.png'
import StripePng from '../assets/stripe.png'
import ZendeskPng from '../assets/zendesk.png'
import SentryPng from '../assets/sentry.png'
import DiscordPng from '../assets/discord.png'

export function getToolIcon(connectorName: string): React.ReactElement {

  // console.log(connectorName)
  switch (connectorName) {
    case 'asana':
      return <img src={asanaPng} alt="Asana" className="w-5 h-5" />
    case 'slack':
      return <img src={slackPng} alt="Slack" className="w-5 h-5" />
    case 'confluence':
      return <img src={confluencePng} alt="Connector Icon" className="w-5 h-5" />
    case 'github':
      return <img src={GithubPng} alt="Connector Icon" className="w-5 h-5" />
    case 'dropbox':
      return <img src={dropBoxPng} alt="Connector Icon" className="w-5 h-5" />
    case 'linear':
      return <img src={LinearPng} alt="Connector Icon" className="w-5 h-5" />
    case 'notion':
      return <img src={NotionPng} alt="Connector Icon" className="w-5 h-5" />
    case 'jira':
      return <img src={JiraPng} alt="Connector Icon" className="w-5 h-5" />
    case 'bamboohr':
      return <img src={BambooHRPng} alt="Connector Icon" className="w-5 h-5" />
    case 'datadog':
      return <img src={DatadogPng} alt="Connector Icon" className="w-5 h-5" />
    case 'fireflies':
      return <img src={FirefliesPng} alt="Connector Icon" className="w-5 h-5" />
    case 'freshdesk':
      return <img src={FreshdeskPng} alt="Connector Icon" className="w-5 h-5" />
    case 'freshchat':
      return <img src={FreshchatPng} alt="Connector Icon" className="w-5 h-5" />
    case 'googleCalendar':
      return <img src={GoogleCalendarPng} alt="Connector Icon" className="w-5 h-5" />
    case 'googleDrive':
      return <img src={GoogleDrivePng} alt="Connector Icon" className="w-5 h-5" />
    case 'googleGmail':
      return <img src={GmailPng} alt="Connector Icon" className="w-5 h-5" />
    case 'hubspot':
      return <img src={HubspotPng} alt="Connector Icon" className="w-5 h-5" />
    case 'mysql':
      return <img src={MySQLPng} alt="Connector Icon" className="w-5 h-5" />
    case 'postgres':
      return <img src={PostgresPng} alt="Connector Icon" className="w-5 h-5" />
    case 'salesforce':
      return <img src={SalesforcePng} alt="Connector Icon" className="w-5 h-5" />
    case 'pipedrive':
      return <img src={PipedrivePng} alt="Connector Icon" className="w-5 h-5" />
    case 'stripe':
      return <img src={StripePng} alt="Connector Icon" className="w-5 h-5" />
    case 'zendesk':
      return <img src={ZendeskPng} alt="Connector Icon" className="w-5 h-5" />
    case 'sentry':
      return <img src={SentryPng} alt="Connector Icon" className="w-5 h-5" />
    case 'airtable':
      return <img src={AirtablePng} alt="Connector Icon" className="w-5 h-5" />
    case 'discord':
      return <img src={DiscordPng} alt="Connector Icon" className="w-5 h-5" />
    case 'amplitude':
      return <img src={AmplitudePng} alt="Connector Icon" className="h-5" />
    case 'newrelic':
      return <img src={NewRelicPng} alt="Connector Icon" className="w-5 h-5" />
    default:
      return <img src={slackPng} alt="Default" className="w-5 h-5" />
  }
} 