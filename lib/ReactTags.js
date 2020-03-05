'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const Tag = require('./Tag')
const Input = require('./Input')
const Suggestions = require('./Suggestions')

const KEYS = {
  ENTER: 13,
  TAB: 9,
  BACKSPACE: 8,
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
  HOME: 36,
  END: 35
}

const CLASS_NAMES = {
  root: 'react-tags',
  rootFocused: 'is-focused',
  selected: 'react-tags__selected',
  selectedTag: 'react-tags__selected-tag',
  selectedTagName: 'react-tags__selected-tag-name',
  search: 'react-tags__search',
  searchInput: 'react-tags__search-input',
  suggestions: 'react-tags__suggestions',
  suggestionActive: 'is-active',
  suggestionDisabled: 'is-disabled'
}

class ReactTags extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      query: '',
      cursor: 0,
      focused: false,
      expandable: false,
      selectedIndex: -1,
      classNames: Object.assign({}, CLASS_NAMES, this.props.classNames)
    }

    this.inputEventHandlers = {
      // Provide a no-op function to the input component to avoid warnings
      // <https://github.com/i-like-robots/react-tags/issues/135>
      // <https://github.com/facebook/react/issues/13835>
      onChange: () => { },
      onBlur: this.handleBlur.bind(this),
      onFocus: this.handleFocus.bind(this),
      onInput: this.handleInput.bind(this),
      onKeyDown: this.handleKeyDown.bind(this)
    }
  }

  componentDidMount () {
    // sets cursor at the end
    this.moveCursor(this.props.tags.length)
  }

  componentWillReceiveProps (newProps) {
    this.setState({
      classNames: Object.assign({}, CLASS_NAMES, newProps.classNames)
    })
  }

  handleInput (e) {
    const query = e.target.value

    if (this.props.handleInputChange) {
      this.props.handleInputChange(query)
    }

    this.setState({ query })
  }

  handleKeyDown (e) {
    const { query, selectedIndex } = this.state
    const { delimiters, delimiterChars } = this.props

    // when one of the terminating keys is pressed, add current query to the tags.
    if (delimiters.indexOf(e.keyCode) > -1) {
      if (query || selectedIndex > -1) {
        e.preventDefault()
      }

      this.handleDelimiter()
    } else if (delimiterChars.indexOf(e.key) > -1) {
      if (query || selectedIndex > -1) {
        e.preventDefault()
      }

      this.handleDelimiter()

      if (this.props.handleDelimiterTrigger) {
        this.props.handleDelimiterTrigger(e.key, this.state.cursor)
      }
    }

    // when backspace key is pressed and query is blank, delete the last tag
    if (
      e.keyCode === KEYS.BACKSPACE &&
      query.length === 0 &&
      this.props.allowBackspace &&
      this.state.cursor > 0
    ) {
      this.deleteTag(this.state.cursor - 1)
    }

    // moving the cursor left and right
    if (
      e.keyCode === KEYS.LEFT_ARROW &&
      query.length === 0 &&
      this.state.cursor > 0
    ) {
      this.moveCursor(this.state.cursor - 1)
    }

    if (
      e.keyCode === KEYS.RIGHT_ARROW &&
      query.length === 0 &&
      this.state.cursor < this.props.tags.length
    ) {
      this.moveCursor(this.state.cursor + 1)
    }

    if (
      e.keyCode === KEYS.HOME &&
      query.length === 0 &&
      this.state.cursor > 0
    ) {
      this.moveCursor(0)
    }

    if (
      e.keyCode === KEYS.END &&
      query.length === 0
    ) {
      this.moveCursor(this.props.tags.length)
    }

    if (e.keyCode === KEYS.UP_ARROW) {
      e.preventDefault()

      // if last item, cycle to the bottom
      if (selectedIndex <= 0) {
        this.setState({
          selectedIndex: this.suggestions.state.options.length - 1
        })
      } else {
        this.setState({ selectedIndex: selectedIndex - 1 })
      }
    }

    if (e.keyCode === KEYS.DOWN_ARROW) {
      e.preventDefault()

      this.setState({
        selectedIndex:
          (selectedIndex + 1) % this.suggestions.state.options.length
      })
    }
  }

  handleDelimiter () {
    const { query, selectedIndex } = this.state

    if (query.length >= this.props.minQueryLength) {
      // Check if the user typed in an existing suggestion.
      const match = this.suggestions.state.options.findIndex(suggestion => {
        return suggestion.name.search(new RegExp(`^${query}$`, 'i')) === 0
      })

      const index = selectedIndex === -1 ? match : selectedIndex

      if (index > -1 && this.suggestions.state.options[index]) {
        this.addTag(this.suggestions.state.options[index])
      } else if (this.props.allowNew) {
        this.addTag({ name: query })
      }
    }
  }

  handleClick (e) {
    if (document.activeElement !== e.target) {
      this.input.input.focus()
    }
  }

  handleBlur () {
    this.setState({ focused: false, selectedIndex: -1 })

    if (this.props.handleBlur) {
      this.props.handleBlur()
    }

    if (this.props.addOnBlur) {
      this.handleDelimiter()
    }
  }

  handleFocus () {
    this.setState({ focused: true })

    if (this.props.handleFocus) {
      this.props.handleFocus()
    }
  }

  addTag (tag) {
    if (tag.disabled) {
      return
    }

    if (
      typeof this.props.handleValidate === 'function' &&
      !this.props.handleValidate(tag)
    ) {
      return
    }

    this.props.handleAddition(tag, this.state.cursor)

    // reset the state
    this.moveCursor(this.state.cursor + 1) // sets cursor in front of what we just ADDED
    this.setState({
      query: '',
      selectedIndex: -1
    })
  }

  deleteTag (i) {
    this.props.handleDelete(i)

    this.moveCursor(i) // sets cursor where we just DELETED

    if (this.props.clearInputOnDelete && this.state.query !== '') {
      this.setState({
        query: ''
      })
    }
  }

  isExpandable () {
    return this.state.focused && this.state.query.length >= this.props.minQueryLength
  }

  renderEditBox () {
    const listboxId = 'ReactTags-listbox'

    return (
      <div className={this.state.classNames.search}>
        <Input
          {...this.state}
          inputAttributes={this.props.inputAttributes}
          inputEventHandlers={this.inputEventHandlers}
          ref={c => {
            this.input = c
          }}
          listboxId={listboxId}
          autofocus={this.props.autofocus}
          autoresize={this.props.autoresize}
          expandable={this.isExpandable()}
          placeholder={this.props.placeholder}
        />
      </div>
    )
  }

  moveCursor (cursor) {
    this.setState({ cursor })
  }

  renderEditPlaceholder (i) {
    return (
      <span
        onClick={() => this.moveCursor(i)}
        className='ReactTags-cursorbox'
      />
    )
  }

  renderTag (tag, i) {
    const TagComponent = this.props.tagComponent || Tag

    return (
      <span key={i} className="ReactTags-tagwrapper">
        {i === this.state.cursor ? this.renderEditBox() : this.renderEditPlaceholder(i)}
        <TagComponent
          tag={tag}
          classNames={this.state.classNames}
          onDelete={this.deleteTag.bind(this, i)}
        />
        {i === this.props.tags.length - 1 ? this.renderEditPlaceholder(i + 1) : null}
        {i === this.props.tags.length - 1 && (i + 1 === this.state.cursor) ? this.renderEditBox() : null}
      </span>
    )
  }

  render () {
    const tags = this.props.tags.map(this.renderTag.bind(this))

    const classNames = [this.state.classNames.root]
    this.state.focused && classNames.push(this.state.classNames.rootFocused)
    const listboxId = 'ReactTags-listbox'
    return (
      <div
        className={classNames.join(' ')}
        onClick={this.handleClick.bind(this)}
      >
        <div
          className={this.state.classNames.selected}
          aria-live='polite'
          aria-relevant='additions removals'
        >
          {tags}
          {this.props.tags.length === 0 ? this.renderEditBox() : null}
        </div>
        <Suggestions
          {...this.state}
          ref={c => {
            this.suggestions = c
          }}
          listboxId={listboxId}
          expandable={this.isExpandable()}
          noSuggestionsText={this.props.noSuggestionsText}
          suggestions={this.props.suggestions}
          suggestionsFilter={this.props.suggestionsFilter}
          addTag={this.addTag.bind(this)}
          maxSuggestionsLength={this.props.maxSuggestionsLength}
        />
      </div>
    )
  }
}

ReactTags.defaultProps = {
  tags: [],
  placeholder: 'Add new tag',
  noSuggestionsText: null,
  suggestions: [],
  suggestionsFilter: null,
  autofocus: true,
  autoresize: true,
  delimiters: [KEYS.TAB, KEYS.ENTER],
  delimiterChars: [],
  minQueryLength: 2,
  maxSuggestionsLength: 6,
  allowNew: false,
  allowBackspace: true,
  tagComponent: null,
  inputAttributes: {},
  addOnBlur: false,
  clearInputOnDelete: true
}

ReactTags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object),
  placeholder: PropTypes.string,
  noSuggestionsText: PropTypes.string,
  suggestions: PropTypes.arrayOf(PropTypes.object),
  suggestionsFilter: PropTypes.func,
  autofocus: PropTypes.bool,
  autoresize: PropTypes.bool,
  delimiters: PropTypes.arrayOf(PropTypes.number),
  delimiterChars: PropTypes.arrayOf(PropTypes.string),
  handleDelete: PropTypes.func.isRequired,
  handleAddition: PropTypes.func.isRequired,
  handleDelimiterTrigger: PropTypes.func,
  handleInputChange: PropTypes.func,
  handleFocus: PropTypes.func,
  handleBlur: PropTypes.func,
  handleValidate: PropTypes.func,
  minQueryLength: PropTypes.number,
  maxSuggestionsLength: PropTypes.number,
  classNames: PropTypes.object,
  allowNew: PropTypes.bool,
  allowBackspace: PropTypes.bool,
  tagComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
  inputAttributes: PropTypes.object,
  addOnBlur: PropTypes.bool,
  clearInputOnDelete: PropTypes.bool
}

module.exports = ReactTags
