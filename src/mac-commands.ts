import { exec, spawn } from 'child_process'

/**
 * This function uses the `say` command to convert text to speech on macOS.
 * It allows you to specify the voice and the rate of speech.
 * The `timeout` parameter controls the speed of the speech, where a higher value means slower speech.
 * If the `timeout` is set to 0, it will use the default rate.
 * @param voice
 * @param timeout
 * @param message
 * @example
 * textToSpeech('Samantha', 200, 'Hello, this is a test message')
 * @returns void
 * @throws Will log an error message if the text-to-speech command fails.
 * @see https://ss64.com/osx/say.html for more information on the `
 */
export function textToSpeech(voice: string = 'Samantha', timeout: number = 0, message: string) {
  const process = exec(`say -v ${voice} -r ${timeout} ${message}`)
  process.on('err', (err) => {
    console.error('Failed text to speech:', err.message)
  })
}

/**
 * Displays a dialog on macOS using AppleScript.
 * This function uses `osascript` to run an AppleScript command that creates a dialog box with the specified title, message, and buttons.
 * It returns a Promise that resolves with the button clicked by the user.
 * If the user clicks "Cancel" or closes the dialog, it resolves with "Cancel".
 * If the user clicks any other button, it resolves with the label of that button.
 * @param title
 * @param message
 * @param buttons
 * @returns
 * @example
 * displayDialog('Reminder', 'This is a reminder message', ['Cancel', 'OK'])
 * @throws Will log an error message if the dialog command fails.
 * @see https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/
 */
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
