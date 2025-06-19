# PM2 Documentation

[PM2 Official Documentation](https://pm2.keymetrics.io/)

# PM2 is a production process manager for Node.js applications with a built-in load balancer.

# It allows you to keep applications alive forever, reload them without downtime, and facilitate common system admin tasks.

## Common Commands

### Start an application

pm2 start app.js

### Stop an application

pm2 stop app.js

### Restart an application

pm2 restart app.js

### List all applications

pm2 list

### Show application logs

pm2 logs app.js

### Monitor application performance

pm2 monit

### Delete an application

pm2 delete app.js

### Save the current process list

pm2 save

### Load the saved process list on startup

pm2 startup

### Show detailed information about an application

pm2 show app.js

### Scale an application to multiple instances

pm2 scale app.js 4

## Example Usage

npx pm2 start dist/index.js --name "termi-todo" -- daemon

- npx pm2 start → Start a process with PM2
- dist/index.js → The main app file to run
- --name "termi-todo" → PM2 argument: name this process "termi-todo"
- -- → SEPARATOR (everything after this goes to your app, not PM2)
- daemon → Argument passed to Commander.js (your app)
