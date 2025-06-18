import { Command } from 'commander'
import inquirer from 'inquirer'
import DatepickerPrompt from 'inquirer-datepicker-prompt'
import { access, constants, existsSync, mkdirSync, writeFile } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import todoData from './data/todoData.json'
import { TodoData } from './types/data.types.js'

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
        .map((i) => i.title)

      console.log('here: ', items)
      // we will handle deletion here...
    } catch (err) {
      console.error(err)
    }
  })

program.parse()
