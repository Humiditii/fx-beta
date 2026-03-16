export class EmailBuilder {
  private to: string;
  private subject: string;
  private html: string;

  setTo(to: string): EmailBuilder {
    this.to = to;
    return this;
  }

  setSubject(subject: string): EmailBuilder {
    this.subject = subject;
    return this;
  }

  setHtml(html: string): EmailBuilder {
    this.html = html;
    return this;
  }

  build() {
    return {
      to: this.to,
      subject: this.subject,
      html: this.html,
    };
  }
}
