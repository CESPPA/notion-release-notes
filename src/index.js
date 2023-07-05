const core = require('@actions/core')
const { Client, LogLevel } = require('@notionhq/client')
const { markdownToBlocks } = require('@tryfabric/martian')

try {
  const body = core.getInput('body')
  const owner = core.getInput('owner')
  const version = core.getInput('version')
  const notes = core.getInput('notes')
  const token = core.getInput('token')
  const repoTags = core.getInput('repoTags') || ''
  const envTags = core.getInput('envTags') || ''
  const verifiedTags = core.getInput('verifiedTags') || ''
  const database = core.getInput('database')
  const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_angeles' })).toISOString()

  core.debug('Creating notion client ...')
  const notion = new Client({
    auth: token,
    logLevel: LogLevel.ERROR
  })

  const blocks = markdownToBlocks(body)
  const repoTagArray = repoTags ? repoTags.split(',').flatMap(tag => { return { name: tag } }) : []
  const envTagArray = envTags ? envTags.split(',').flatMap(tag => { return { name: tag } }) : []
  const verifiedTagArray = verifiedTags ? verifiedTags.split(',').flatMap(tag => { return { name: tag } }) : []

  core.debug('Creating page ...')
  notion.pages.create({
    parent: {
      database_id: database
    },
    properties: {
      'Deploy Log': {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: notes
            }
          }
        ]
      },
      Version: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: version
            }
          }
        ]
      },
      Date: {
        date: {
          start: date
        }
      },
      'Top Level Repos': {
        multi_select: repoTagArray
      },
      Deployer: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: owner
            }
          }
        ]
      },
      Environment: {
        multi_select: envTagArray
      },
      Verified: {
        multi_select: verifiedTagArray
      }
    },
    children: blocks
  }).then((result) => {
    core.debug(`${result}`)
    core.setOutput('status', 'complete')
  })
} catch (error) {
  core.setFailed(error.message)
}
