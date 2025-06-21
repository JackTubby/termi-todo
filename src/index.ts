import { Command } from 'commander'
import inquirer from 'inquirer'
import DatepickerPrompt from 'inquirer-datepicker-prompt'
import { access, constants, existsSync, mkdirSync, promises, writeFile, writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { TodoData } from './types/data.types.js'
import { textToSpeech, displayDialog } from './mac-commands'
import path from 'path'

inquirer.registerPrompt('datetime', DatepickerPrompt)

const DATAFILEPATH = path.join(process.cwd(), 'src', 'data', 'todo-items')

const program = new Command()

program.name('termi-todo').description('A simple CLI tool').version('1.0.0')

// npm run cli create
program
  .command('create')
  .description('Create a todo item')
  .action(async () => {
    try {
      const { title } = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Title:',
          validate: (v) => (v.trim() ? true : 'Title is required'),
        },
      ])

      const { description } = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: 'No description provided',
        },
      ])

      const id = uuidv4()
      const dateDir = new Date().toISOString().split('T')[0]
      const fileName = `${id}.json`

      const directoryPath = path.join(DATAFILEPATH, dateDir)
      const filePath = path.join(directoryPath, fileName)

      const todo = {
        id,
        title,
        description,
        createdAt: new Date().toISOString(),
      }

      mkdirSync(directoryPath, { recursive: true })

      writeFileSync(filePath, JSON.stringify(todo, null, 2))
      console.log(`Todo item created`)
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

      const transformDate = new Date(date).toISOString().split('T')[0]
      const directoryPath = path.join(DATAFILEPATH, transformDate)
      const todoData: TodoData[] = []
      if (existsSync(directoryPath)) {
        const files = await promises.readdir(directoryPath)
        for (const file of files) {
          const filePath = path.join(directoryPath, file)
          const data = await promises.readFile(filePath, 'utf-8')
          const todoItem: TodoData = JSON.parse(data)
          todoData.push(todoItem)
        }
      } else {
        console.log(`No todo items found for the selected date: ${transformDate}`)
        return
      }
      if (todoData.length === 0) {
        console.log(`No todo items found for the selected date: ${transformDate}`)
        return
      }
      const { deleteItem } = await inquirer.prompt<{ deleteItem: string }>([
        {
          type: 'list',
          name: 'deleteItem',
          message: 'Select an item to delete:',
          choices: todoData.map((item) => ({
            name: item.title,
            value: item.id,
          })),
        },
      ])
      const filePath = path.join(directoryPath, `${deleteItem}.json`)
      if (existsSync(filePath)) {
        await promises.unlink(filePath)
        console.log(`Successfully deleted item ${deleteItem}`)
        const files = await promises.readdir(directoryPath)
        if (files.length === 0) {
          await promises.rmdir(directoryPath)
          console.log(`Removed empty directory: ${directoryPath}`)
        }
      } else {
        console.log(`Item with ID ${deleteItem} not found.`)
      }
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

    setInterval(() => {}, 60000)

    console.log('Daemon running - checking for reminders every minute')
  })

if (process.argv.length <= 2 && process.env.NODE_ENV !== 'production') {
  program.help()
} else {
  program.parse()
}
