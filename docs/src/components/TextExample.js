/* global React, ReactEditableContent */
/* eslint-disable no-unused-vars, react/jsx-no-undef */

const { PureComponent } = React
const { EditableText } = ReactEditableContent

class TextExample extends PureComponent {
    state = {
        intro: 'I like to highlight stuff ...'
    }

    renderText = text =>
        text.split(/(\s)/).map((item, idx) =>
        item.startsWith('highlight') ?
            <Highlight key={ idx } color="#FF0">{ item }</Highlight> :
        <span key={ idx }>{ item }</span>
        )

    textChange = intro => this.setState({ intro })

    render() {
        return (
            <div>
                <pre style={{ margin: '20px' }}>
                    { this.state.intro }
                </pre>
                <EditableText
                    className="App-intro"
                    text={ this.state.intro }
                    onChange={ this.textChange }
                    render={ this.renderText }
                />
            </div>
        )
    }
}