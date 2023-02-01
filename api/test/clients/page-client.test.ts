const mockGetConsole = jest.fn();
const mockSaveConsole = jest.fn();

jest.mock('../../src/clients/console-client', () => ({
  getConsole: mockGetConsole,
  saveConsole: mockSaveConsole
}));

import Console from '../../src/classes/console';
import Page from '../../src/classes/page';
import PageClient from '../../src/clients/page-client';
import HttpError from 'http-errors';

describe('page client tests', () => {
  afterEach(() => {
    // for mocks
    jest.resetAllMocks();
    // for spies
    jest.restoreAllMocks();
  });
  describe('handleError', () => {
    describe('reuses console client errors when possible', () => {
      it('CONFIG_PATH', () => {
        const error = HttpError.InternalServerError('Cannot fetch consoles! No value was found for CONFIG_PATH!');
        let thrownError;
        try {
          PageClient.handleError(error);
        } catch (e) {
          thrownError = e;
        } finally {
          expect(thrownError).toBeDefined();
          expect(thrownError).toEqual(
            HttpError.InternalServerError('Cannot fetch pages! No value was found for CONFIG_PATH!')
          );
        }
      });
      it('Config file', () => {
        const error = HttpError.NotFound('Cannot fetch consoles! Config file test.yml not found!');
        let thrownError;
        try {
          PageClient.handleError(error);
        } catch (e) {
          thrownError = e;
        } finally {
          expect(thrownError).toBeDefined();
          expect(thrownError).toEqual(
            HttpError.NotFound('Cannot fetch pages! Config file test.yml not found!')
          );
        }
      });
    });
    it('re-throws error', () => {
      const error = new Error('Error!');
      let thrownError;
      try {
        PageClient.handleError(error);
      } catch (e) {
        thrownError = e;
      } finally {
        expect(thrownError).toBeDefined();
        expect(thrownError).toEqual(error);
      }
    });
  });
  describe('getPage', () => {
    it('returns page from console matching the route specified', async () => {
      const mockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [
          mockPage
        ],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);

      const result = await PageClient.getPage('mock-console', '/mock-route');

      expect(result).toEqual(mockPage);
    });
    it('throws not found if page does not exist on the console', async () => {
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);

      let thrownError;
      try {
        await PageClient.getPage('mock-console', '/mock-route');
      } catch (error) {
        thrownError = error;
      } finally {
        expect(thrownError).toBeDefined();
        expect(thrownError).toEqual(
          HttpError.NotFound('Page with route /mock-route does not exist in console mock-console!')
        );
      }
    });
  });

  describe('getPages', () => {
    it('returns pages from console', async () => {
      const mockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [
          mockPage
        ],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);

      const result = await PageClient.getPages('mock-console');

      expect(result).toEqual([mockPage]);
    });
    it('throws if an error occurs', async () => {
      const mockError = new Error('Error!');
      mockGetConsole.mockImplementationOnce(()=> { throw mockError; });

      let thrownError;
      try {
        await PageClient.getPages('mock-console');
      } catch (error) {
        thrownError = error;
      } finally {
        expect(thrownError).toBeDefined();
        expect(thrownError).toEqual(mockError);
      }
    });
  });
  describe('createPage', () => {
    it('saves page to console and returns saved page', async () => {
      const mockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [],
        providers: [],
        widgets: []
      });
      const mockSavedConsole = Console.fromObject({
        name: 'mock-console',
        pages: [mockPage],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);
      mockGetConsole.mockResolvedValueOnce(mockSavedConsole);
      jest.spyOn(PageClient, 'getPage');

      const result = await PageClient.createPage('mock-console', mockPage);

      expect(mockGetConsole).toBeCalledTimes(2);
      expect(mockSaveConsole).toBeCalledTimes(1);
      expect(PageClient.getPage).toBeCalledTimes(1);
      expect(result).toEqual(mockPage);
    });
    it('throws Conflict if page already exists on console', async () => {
      const mockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [mockPage],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);
      jest.spyOn(PageClient, 'getPage');

      let thrownError;
      try {
        await PageClient.createPage('mock-console', mockPage);
      } catch (error) {
        thrownError = error;
      } finally {
        expect(mockGetConsole).toBeCalledTimes(1);
        expect(mockSaveConsole).not.toBeCalled();
        expect(PageClient.getPage).not.toBeCalled();

        expect(thrownError).toBeDefined();
        expect(thrownError).toEqual(
          HttpError.Conflict('Cannot create new page with route /mock-route because a page with this route already exists on console mock-console!')
        );
      }
    });
  });
  describe('updatePage', () => {
    it('saves page to console and returns saved page', async () => {
      const oldMockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const oldMockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [
          oldMockPage
        ],
        providers: [],
        widgets: []
      });
      const newMockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: ['widget-1']
      }); 
      const newMockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [newMockPage],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(oldMockConsole);
      mockGetConsole.mockResolvedValueOnce(newMockConsole);
      jest.spyOn(PageClient, 'getPage');

      const result = await PageClient.updatePage('mock-console', '/mock-route', newMockPage);

      expect(mockGetConsole).toBeCalledTimes(2);
      expect(mockSaveConsole).toBeCalledTimes(1);
      expect(PageClient.getPage).toBeCalledTimes(1);
      expect(result).toEqual(newMockPage);
    });
    it('throws NotFound if page does not exist on console', async () => {
      const mockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);
      jest.spyOn(PageClient, 'getPage');

      let thrownError;
      try {
        await PageClient.updatePage('mock-console', '/mock-route', mockPage);
      } catch (error) {
        thrownError = error;
      } finally {
        expect(mockGetConsole).toBeCalledTimes(1);
        expect(mockSaveConsole).not.toBeCalled();
        expect(PageClient.getPage).not.toBeCalled();

        expect(thrownError).toBeDefined();
        expect(thrownError).toEqual(
          HttpError.NotFound('Cannot update page with route /mock-route because this page does not exist on console mock-console!')
        );
      }
    });
  });
  describe('deletePage', () => {
    it('deletes page from console and returns deleted page', async () => {
      const mockPage = Page.fromObject({
        route: '/mock-route',
        widgetIds: []
      });
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [
          mockPage
        ],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);

      const result = await PageClient.deletePage('mock-console', '/mock-route');

      expect(mockGetConsole).toBeCalledTimes(1);
      expect(mockSaveConsole).toBeCalledTimes(1);
      expect(result).toEqual(mockPage);
    });
    it('throws NotFound if page does not exist on console', async () => {
      const mockConsole = Console.fromObject({
        name: 'mock-console',
        pages: [],
        providers: [],
        widgets: []
      });
      mockGetConsole.mockResolvedValueOnce(mockConsole);
      jest.spyOn(PageClient, 'getPage');

      let thrownError;
      try {
        await PageClient.deletePage('mock-console', '/mock-route');
      } catch (error) {
        thrownError = error;
      } finally {
        expect(mockGetConsole).toBeCalledTimes(1);
        expect(mockSaveConsole).not.toBeCalled();
        expect(PageClient.getPage).not.toBeCalled();

        expect(thrownError).toBeDefined();
        expect(thrownError).toEqual(
          HttpError.NotFound('Cannot delete page with route /mock-route because this page does not exist on console mock-console!')
        );
      }
    });
  });
});