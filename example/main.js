'use strict'

const React = require('react')
const ReactDOM = require('react-dom')
const ReactTags = require('../lib/ReactTags')
const suggestions = require('./countries')

class App extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tags: [
        { id: 184, name: 'A' },
        { id: 184, name: 'B' },
        { id: 184, name: 'C' },
        { id: 184, name: 'D' },
        { id: 184, name: 'E' },
        { id: 86, name: 'F' }
      ],
      suggestions
    }
  }

  handleDelete (i) {
    const tags = this.state.tags.slice(0)
    tags.splice(i, 1)
    this.setState({ tags })
  }

  handleAddition (tag, cursor) {
    let tags = this.state.tags.slice(0)
    tags = tags.slice(0, cursor).concat(tag, tags.slice(cursor, tags.length))
    this.setState({ tags })
  }

  render () {
    return (
      <React.Fragment>
        <p>Select the countries you have visited using React Tags below:</p>
        <ReactTags
          tags={this.state.tags}
          noSuggestionsText={'No suggestions found'}
          suggestions={this.state.suggestions}
          handleDelete={this.handleDelete.bind(this)}
          handleAddition={this.handleAddition.bind(this)} />
        <p>Output:</p>
        <pre><code>{JSON.stringify(this.state.tags, null, 2)}</code></pre>
      </React.Fragment>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))
