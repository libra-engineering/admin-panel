import React from "react"
import asanaPng from '../assets/asana.png'
import slackPng from '../assets/slack.png'
import GithubPng from '../assets/github.png'
import AirtablePng from '../assets/airtable.png'
import AmplitudePng from '../assets/amplitude.png'
import dropBoxPng from "../assets/dropbox.png"
import confluencePng from '../assets/confluence.png'
import gCalendarPng from '../assets/gCalendar.png'
import LinearPng from '../assets/linear.png'
import NotionPng from '../assets/notion.png'
import JiraPng from '../assets/jira.png'
import BambooHRPng from '../assets/bamboohr.png'
import ConfluencePng from '../assets/confluence.png'
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

export function getToolIcon(connectorName: string): React.ReactElement {


  switch (connectorName) {
    case 'asana':
      return <img src={asanaPng} alt="Asana" className="w-5 h-5" />
    case 'slack':
      return <img src={slackPng} alt="Slack" className="w-5 h-5" />
    case 'googleCalendar':
      return <img src={gCalendarPng} alt="Google Calendar" className="w-5 h-5" />
    case 'confluence':
      return <img src={confluencePng} alt="Google Calendar" className="w-5 h-5" />
    case 'github':
      return <img src={GithubPng} alt="Google Calendar" className="w-5 h-5" />
    case 'dropbox':
      return <img src={dropBoxPng} alt="Google Calendar" className="w-5 h-5" />
    case 'linear':
      return <img src={LinearPng} alt="Google Calendar" className="w-5 h-5" />
    case 'notion':
      return <img src={NotionPng} alt="Google Calendar" className="w-5 h-5" />
    case 'jira':
      return <img src={JiraPng} alt="Google Calendar" className="w-5 h-5" />
    case 'bamboohr':
      return <img src={BambooHRPng} alt="Google Calendar" className="w-5 h-5" />
    case 'confluence':
      return <img src={ConfluencePng} alt="Google Calendar" className="w-5 h-5" />
    case 'datadog':
      return <img src={DatadogPng} alt="Google Calendar" className="w-5 h-5" />
    case 'fireflies':
      return <img src={FirefliesPng} alt="Google Calendar" className="w-5 h-5" />
    case 'freshdesk':
      return <img src={FreshdeskPng} alt="Google Calendar" className="w-5 h-5" />
    case 'freshchat':
      return <img src={FreshchatPng} alt="Google Calendar" className="w-5 h-5" />
    case 'googleCalendar':
      return <img src={GoogleCalendarPng} alt="Google Calendar" className="w-5 h-5" />
    case 'googleDrive':
      return <img src={GoogleDrivePng} alt="Google Calendar" className="w-5 h-5" />
    case 'gmail':
      return <img src={GmailPng} alt="Google Calendar" className="w-5 h-5" />
    case 'hubspot':
      return <img src={HubspotPng} alt="Google Calendar" className="w-5 h-5" />
    case 'mysql':
      return <img src={MySQLPng} alt="Google Calendar" className="w-5 h-5" />
    case 'postgres':
      return <img src={PostgresPng} alt="Google Calendar" className="w-5 h-5" />
    case 'salesforce':
      return <img src={SalesforcePng} alt="Google Calendar" className="w-5 h-5" />
    case 'pipedrive':
      return <img src={PipedrivePng} alt="Google Calendar" className="w-5 h-5" />
    case 'stripe':
      return <img src={StripePng} alt="Google Calendar" className="w-5 h-5" />
    case 'zendesk':
      return <img src={ZendeskPng} alt="Google Calendar" className="w-5 h-5" />
    case 'sentry':
      return <img src={SentryPng} alt="Google Calendar" className="w-5 h-5" />
    default:
      return <img src={slackPng} alt="Default" className="w-5 h-5" />
  }
} 