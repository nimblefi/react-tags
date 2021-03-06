"use strict";

const React = require("react");

function escapeForRegExp(query) {
  return query.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
}

function markIt(input, query) {
  if (query) {
    const regex = RegExp(escapeForRegExp(query), "gi");
    input = input.replace(regex, "<mark>$&</mark>");
  }

  return {
    __html: input
  };
}

function filterSuggestions(
  query,
  suggestions,
  length,
  suggestionsFilter,
  noSuggestionsText
) {
  if (!suggestionsFilter) {
    const regex = new RegExp(`(?:^|\\s)${escapeForRegExp(query)}`, "i");
    suggestionsFilter = item => regex.test(item.name);
  }

  const filtered = suggestions
    .filter(item => suggestionsFilter(item, query))
    .slice(0, length);

  if (filtered.length === 0 && noSuggestionsText) {
    filtered.push({
      id: 0,
      name: noSuggestionsText,
      disabled: true,
      disableMarkIt: true
    });
  }

  return filtered.sort(item => (item.type === "group" ? -1 : 1));
}

class Suggestions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: filterSuggestions(
        this.props.query,
        this.props.suggestions,
        this.props.maxSuggestionsLength,
        this.props.suggestionsFilter,
        this.props.noSuggestionsText
      )
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      options: filterSuggestions(
        newProps.query,
        newProps.suggestions,
        newProps.maxSuggestionsLength,
        newProps.suggestionsFilter,
        newProps.noSuggestionsText
      )
    });
  }

  handleMouseDown(item, e) {
    // focus is shifted on mouse down but calling preventDefault prevents this
    e.preventDefault();
    this.props.addTag(item);
  }

  renderLiGroup(arr, startingIndex) {
    return arr.map((item, i) => {
      const key = `${this.props.listboxId}-${startingIndex}`;
      const classNames = [];

      if (this.props.selectedIndex === startingIndex++) {
        console.log("this.props.classNames.suggestionActive");

        classNames.push(this.props.classNames.suggestionActive);
      }

      if (item.disabled) {
        classNames.push(this.props.classNames.suggestionDisabled);
      }

      return (
        <li
          id={key}
          key={key}
          role="option"
          className={classNames.join(" ")}
          aria-disabled={item.disabled === true}
          onMouseDown={this.handleMouseDown.bind(this, item)}
        >
          <span
            className="listbox-item-description"
            dangerouslySetInnerHTML={markIt(
              item.description || "",
              this.props.query,
              item.markInput
            )}
          />
          <span
            className="listbox-item-name"
            dangerouslySetInnerHTML={markIt(
              `${item.form} ${item.tagname}` || "",
              this.props.query,
              item.markInput
            )}
          />
        </li>
      );
    });
  }

  renderTitle(title) {
    return <div className="listbox-group-title">{title}</div>;
  }

  render() {
    if (!this.props.expandable || !this.state.options.length) {
      return null;
    }

    const labels = this.state.options.filter(item => item.type === "label");
    const groups = this.state.options.filter(item => item.type === "group");

    return (
      <div
        className={[
          this.props.classNames.suggestions,
          labels.length + groups.length === 0 ? "listbox-empty" : ""
        ].join(" ")}
      >
        <ul role="listbox" id={this.props.listboxId}>
          {groups.length > 0 && this.renderTitle("Groups")}
          {this.renderLiGroup(groups, 0)}

          {labels.length > 0 && this.renderTitle("Labels")}
          {this.renderLiGroup(labels, groups.length)}
        </ul>
      </div>
    );
  }
}

module.exports = Suggestions;
