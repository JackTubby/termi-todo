import { Command } from 'commander'
import inquirer from 'inquirer'
import DatepickerPrompt from 'inquirer-datepicker-prompt'
import { access, constants, existsSync, mkdirSync, writeFile, writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import todoData from './data/todoData.json'
import { TodoData } from './types/data.types.js'
import { textToSpeech, displayDialog } from './mac-commands'

inquirer.registerPrompt('datetime', DatepickerPrompt)

const FILEPATH = './src/data/'
const FILENAME = 'todoData.json'

const program = new Command()

program.name('termi-todo').description('A simple CLI tool').version('1.0.0')

program
  .command('create')
  .description('Create a todo item')
  .action(async () => {
    try {
      const { title } = await inquirer.prompt<{ title: string }>([
        {
          type: 'input',
          name: 'title',
          message: 'Title:',
          validate: (v) => (v.trim() ? true : 'Title is required'),
        },
      ])

      const { description } = await inquirer.prompt<{ description: string }>([
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: 'No description provided',
        },
      ])

      const transform = {
        id: uuidv4(),
        title,
        description,
        createdAt: new Date().toISOString(),
      }

      if (!existsSync(FILEPATH)) {
        mkdirSync(FILEPATH, { recursive: true })
      }

      access(`${FILEPATH}${FILENAME}`, constants.F_OK, (err) => {
        if (err) {
          writeFile(`${FILEPATH}${FILENAME}`, JSON.stringify([transform], null, 2), (err) => {
            if (err) {
              console.error('Error writing file:', err)
            } else {
              console.log('Todo item created successfully!')
            }
          })
        } else {
          import('fs/promises').then(async (fs) => {
            try {
              const data = await fs.readFile(`${FILEPATH}${FILENAME}`, 'utf-8')
              const todos = JSON.parse(data)
              todos.push(transform)
              await fs.writeFile(`${FILEPATH}${FILENAME}`, JSON.stringify(todos, null, 2))
              console.log('Todo item added successfully!')
            } catch (error) {
              console.error('Error updating todo file:', error)
            }
          })
        }
      })
    } catch (err) {
      console.error(err)
    }
  })

program
  .command('delete')
  .description('Delete a todo item')
  .action(async () => {
    let date = new Date().toISOString()
    try {
      const { when } = await inquirer.prompt<{ when: string }>([
        {
          type: 'list',
          name: 'when',
          message: 'View items to delete',
          choices: [
            {
              name: 'Today',
              value: new Date().toISOString(),
            },
            {
              name: 'Yesterday',
              value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              name: 'Custom Date',
              value: 'custom',
            },
          ],
        },
      ])

      if (when === 'custom') {
        const { customDate } = await inquirer.prompt<{ customDate: Date }>([
          {
            type: 'datetime',
            name: 'customDate',
            message: 'Pick a date:',
            format: ['yyyy', '-', 'mm', '-', 'dd'],
            initial: new Date(),
          },
        ] as any)
        date = customDate.toISOString()
      } else {
        date = when
      }

      const items = todoData
        .filter((i: TodoData) => {
          return i.createdAt.startsWith(date.split('T')[0])
        })
        .map((i) => {
          return {
            id: i.id,
            title: i.title,
          }
        })

      if (items.length === 0) {
        console.log('No items found for the selected date.')
        return
      }

      const { deleteItem } = await inquirer.prompt<{ deleteItem: string }>([
        {
          type: 'list',
          name: 'deleteItem',
          message: 'Select an item to delete:',
          choices: items.map((item) => ({
            name: item.title,
            value: item.id,
          })),
        },
      ])

      const updatedItems = todoData.filter((i) => i.id != deleteItem)
      writeFileSync(FILEPATH + FILENAME, JSON.stringify(updatedItems))
      console.log(`Successfully deleted item ${deleteItem}`)
    } catch (err) {
      console.error(err)
    }
  })

// Test PM2 - replace with actual daemon functionality later
program
  .command('daemon')
  .description('Run as background service')
  .action(() => {
    console.log('Starting termi-todo daemon...')

    setInterval(() => {
    }, 60000)

    console.log('Daemon running - checking for reminders every minute')
  })

if (process.argv.length <= 2 && process.env.NODE_ENV !== 'production') {
  program.help()
} else {
  program.parse()
}
