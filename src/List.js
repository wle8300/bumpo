import Item from './Item'
import ButtonAddItem from './ButtonAddItem'
import BulkEditor from './BulkEditor'

import React, {Component} from 'react'
import Firebase from './Firebase'


class List extends Component {

  constructor(props) {

    super(props)
    this.state = {
      isBulkEditorVisible: false,
      isBumpEngaged: false,
      queuedBumps: 0,
      itemsToJump: [],
      isShifting: false,
      shiftingElapsed: 0,
    }
    this._triggerEffectiveBump = null
    this._sortItems = function (items) {
      return items.sort((a, b) =>  a.timestamp - b.timestamp).sort((a, b) => b.score - a.score)
    }
    this.handleBump = this.handleBump.bind(this)
    this.toggleBulkEditor = this.toggleBulkEditor.bind(this)
  }

  render() {

    const totalScore = this.props.items.map((item) => item.score).reduce((a, b) => a + b, 0)


    return (
      <div style={{zIndex: 1, position: 'fixed', top: 0, display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
        <div onTouchTap={this.props.handleCloseList} style={this.styleA()}>{this.props.list.name} ({totalScore})</div>
        <ul style={this.styleB()}>
          {
            this._sortItems(this.props.items)
            .map((item, index) => <Item key={item.id} handleBump={this.handleBump.bind(null, item.id)} item={item} isGettingJumped={this.state.itemsToJump.indexOf(item.id) > -1}/>)
          }
        </ul>
        <ButtonAddItem
          _list_={this.props.list.id}
          toggleBulkEditor={this.toggleBulkEditor}
        />
        <BulkEditor
          _list_={this.props.list.id}
          items={this.props.items}
          isVisible={this.state.isBulkEditorVisible}
          toggleBulkEditor={this.toggleBulkEditor}
        />
      </div>
    )
  }

  toggleBulkEditor() {

    this.setState({isBulkEditorVisible: !this.state.isBulkEditorVisible})
  }

  handleBump (id) {

    clearTimeout(this._triggerEffectiveBump)


    const queueBumpAndWait = () => {

      this.setState({queuedBumps: this.state.queuedBumps + 1}, () => {

        const oldItem = this.props.items.filter((item) => item.id === id)[0]
        const newItem = Object.assign({}, oldItem, {score: oldItem.score + this.state.queuedBumps, lastUpdated: Firebase.database.ServerValue.TIMESTAMP})

        const oldOrderedItems = this._sortItems(this.props.items)
        const newOrderedItems = this._sortItems(this.props.items.filter((item) => item.id !== id).concat(newItem))

        const oldIndex = oldOrderedItems.map((item) => item.id).indexOf(id)
        const newIndex = newOrderedItems.map((item) => item.id).indexOf(id)
        const oldSubordinateItems = oldOrderedItems.slice(oldIndex).slice(1).map((item) => item.id)
        const newSubordinateItems = newOrderedItems.slice(newIndex).slice(1).map((item) => item.id)
        const differenceOldNewSubordinateItems = newSubordinateItems.filter((_item_) => oldSubordinateItems.indexOf(_item_) === -1)


        this.setState({itemsToJump: differenceOldNewSubordinateItems}, () => {

          this._triggerEffectiveBump = setTimeout(() => {

            // animate :DDDDDDDD


            // (CB) firebase!
            // (CB) reset (S)
            Firebase.database()
            .ref('/user_items/' +Firebase.auth().currentUser.uid+ '/' +id)
            .set(newItem)
            .then((error) => {

              if (error) alert(error)

              this.setState({
                isBumpEngaged: false,
                queuedBumps: 0,
                itemsToJump: [],
                isShifting: false,
                shiftingElapsed: 0,
              })
            })
          }, 800)
        })
      })
    }


    if (!this.state.isBumpEngaged) this.setState({isBumpEngaged: true}, queueBumpAndWait)
    if (this.state.isBumpEngaged) queueBumpAndWait()
  }

  styleA() {
    return {
      display : 'flex',
      // flex: '0 1 10vh',
      justifyContent : 'center',
      alignItems : 'center',
      padding: '1rem',
      fontFamily: 'helvetica',
      fontSize: '2rem',
      color: '#ffffff',
      backgroundColor: '#bbbbbb',
    }
  }

  styleB() {
    return {
      // flex: '1 1 auto',
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      height: '100%',
      overflowY: 'scroll',
      overflowX: 'hidden',
      listStyle: 'none',
      backgroundColor: '#cccccc',
      overflowScrolling: 'touch',
      WebkitOverflowScrolling: 'touch',
    }
  }
}

export default List
