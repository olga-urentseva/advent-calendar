import './styles.css'
import { SmallTree } from './SmallTree'
import { BigTree } from './BigTree'

export function Tree() {
  return (
    <div className="tree">
      <div className="tree__section tree__section--top"></div>
      <div className="tree__section tree__section--upper"></div>
      <div className="tree__section tree__section--middle"></div>
      <div className="tree__section tree__section--lower"></div>
    </div>
  )
}

export { SmallTree, BigTree }
