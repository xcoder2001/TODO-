const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const filePath = path.join(__dirname, 'todoApplication.db')
let db = null
app.use(express.json())

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server runnig at http://localhost:3000/')
    })
  } catch (err) {
    console.log(`Database Error : ${err.message}`)
    process.exit(1)
  }
}

intializeDBAndServer()

const hasPriorityAndStatusProperties = reqQuery => {
  return reqQuery.status !== undefined && reqQuery.priority !== undefined
}

const hasPriorityProperties = reqQuery => {
  return reqQuery.priority !== undefined
}

const hasStatusProperties = reqQuery => {
  return reqQuery.status !== undefined
}

// API 1

app.get('/todos/', async (req, res) => {
  const reqFilters = req.query
  const {search_q = '', status, priority} = reqFilters
  let sqlQuery = null

  switch (true) {
    case hasPriorityAndStatusProperties(reqFilters):
      sqlQuery = `SELECT * FROM todo where todo LIKE '%${search_q}%'AND
        status = '${status}' AND priority = '${priority}'`
      console.log(status)
      console.log(priority)
      break

    case hasStatusProperties(reqFilters):
      sqlQuery = `SELECT * FROM todo where todo LIKE '%${search_q}%' AND
        status ='${status}'`
      break
    case hasPriorityProperties(reqFilters):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND
        priority  = '${priority}';`
      break

    default:
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      console.log(search_q)
  }
  const dbResponse = await db.all(sqlQuery)
  res.send(dbResponse)
})

// API 2
// Returns a specific todo based on id...

app.get('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const sqlQuery = `SELECT * FROM todo WHERE id = ${todoId}`
  const dbResponse = await db.get(sqlQuery)
  res.send(dbResponse)
})

// API 3
// Creating a todo in todo table...

app.post('/todos/', async (req, res) => {
  const todoDetails = req.body
  console.log(todoDetails)
  const {id, todo, status, priority} = todoDetails
  const sqlQuery = `INSERT INTO todo (id,todo,priority,status)VALUES (${id}, '${todo}', '${status}', '${priority}')`
  const dbResponse = await db.run(sqlQuery)
  console.log(dbResponse)
  res.send('Todo Successfully Added')
})

// API 4
// Update the details of specific todo based on todo id...

app.put('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const previousTodoQuery = `SELECT * FROM todo WHERE id  = ${todoId}`

  const previousTodo = await db.get(previousTodoQuery)
  console.log(previousTodo)
  const {
    id = previousTodo.id,
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = req.body
  const updateQuery = `UPDATE todo SET id = ${id},todo = '${todo}',
  status = '${status}', priority = '${priority}' `
  await db.run(updateQuery)
  const dbResponse = await db.get(previousTodoQuery)
  console.log(dbResponse)
  switch (true) {
    case previousTodo.todo !== dbResponse.todo &&
      previousTodo.status !== dbResponse.status &&
      previousTodo.priority !== dbResponse.priority:
      res.send('All Fields are Updated')
    case previousTodo.todo !== dbResponse.todo:
      res.send('Todo Updated')
      break
    case previousTodo.status !== dbResponse.status:
      res.send('Status Updated')
      break
    case previousTodo.priority !== dbResponse.priority:
      res.send('Priority Updated')
      break
    default:
      res.send('No Fields are Updated')
  }
})

// API 5
// Delete a todo from the todo table based on the todo id ...
app.delete('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId}`
  const dbResponse = await db.run(deleteQuery)
  console.log(dbResponse)
  if (dbResponse.changes === 0) {
    res.send('No records on the given id')
  } else {
    res.send('Todo Deleted')
  }
})

module.exports = app
