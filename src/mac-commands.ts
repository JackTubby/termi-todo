import { exec, spawn } from 'child_process'

export function textToSpeech(voice: string = 'Samantha', timeout: number = 0, message: string) {
  const process = exec(`say -v ${voice} -r ${timeout} ${message}`)
  process.on('err', (err) => {
    console.error('Failed text to speech:', err.message)
  })
}

export function displayDialog(title: string, message: string, buttons: string[] = ['Cancel', 'OK']): Promise<string> {
  return new Promise((resolve) => {
    const buttonList = buttons.map((b) => `"${b}"`).join(', ')
    const script = `display dialog "${message}" with title "${title}" buttons {${buttonList}} default button "${
      buttons[buttons.length - 1]
    }"`

    const process = spawn('osascript', ['-e', script])

    let output = ''

    process.stdout.on('data', (data) => {
      output += data.toString().trim()
    })

    process.on('close', (code) => {
      if (code === 0 && output.includes('button returned:')) {
        const buttonMatch = output.match(/button returned:(.+)/)
        const clickedButton = buttonMatch ? buttonMatch[1].trim() : buttons[buttons.length - 1]
        resolve(clickedButton)
        console.log('User acknowledged the reminder')
      } else {
        resolve('Cancel')
        console.log('User dismissed the reminder')
      }
    })

    process.on('error', () => resolve('Cancel'))
  })
}
