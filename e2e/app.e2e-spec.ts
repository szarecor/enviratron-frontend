import { EnviratronPage } from './app.po';

describe('enviratron App', () => {
  let page: EnviratronPage;

  beforeEach(() => {
    page = new EnviratronPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
