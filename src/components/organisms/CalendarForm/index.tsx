import { FormGroup } from '../../atoms/FormGroup'
import { Label } from '../../atoms/Label'
import { Input } from '../../atoms/Input'

interface CalendarFormProps {
  createdBy: string
  to: string
  onCreatedByChange: (createdBy: string) => void
  onToChange: (to: string) => void
}

export function CalendarForm({ 
  createdBy, 
  to, 
  onCreatedByChange, 
  onToChange 
}: CalendarFormProps) {
  return (
    <div className="calendar-form">
      <FormGroup>
        <Label htmlFor="created-by">Created By</Label>
        <Input
          id="created-by"
          type="text"
          value={createdBy}
          onChange={(e) => onCreatedByChange(e.target.value)}
          placeholder="Your name"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="text"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          placeholder="Recipient's name"
        />
      </FormGroup>
    </div>
  )
}
