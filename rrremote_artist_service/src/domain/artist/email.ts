import { ValueObject } from "ddd-base"

export interface EmailProps {
  name: string
}

export class Email extends ValueObject<EmailProps>{
  constructor(props: EmailProps) {
    super(props)
  }
}