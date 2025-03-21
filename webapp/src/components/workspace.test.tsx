// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {act, render, waitFor} from '@testing-library/react'
import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {MemoryRouter} from 'react-router-dom'
import {mocked} from 'ts-jest/utils'

import userEvent from '@testing-library/user-event'

import thunk from 'redux-thunk'

import {IUser} from '../user'
import {TestBlockFactory} from '../test/testBlockFactory'
import {mockDOM, mockMatchMedia, mockStateStore, wrapDNDIntl} from '../testUtils'
import {Constants} from '../constants'
import {Utils} from '../utils'

import Workspace from './workspace'

Object.defineProperty(Constants, 'versionString', {value: '1.0.0'})
jest.useFakeTimers()
jest.mock('../utils')
jest.mock('draft-js/lib/generateRandomKey', () => () => '123')
const mockedUtils = mocked(Utils, true)
const board = TestBlockFactory.createBoard()
board.id = 'board1'
board.teamId = 'team-id'
board.cardProperties = [
    {
        id: 'property1',
        name: 'Property 1',
        type: 'text',
        options: [
            {
                id: 'value1',
                value: 'value 1',
                color: 'propColorBrown',
            },
        ],
    },
    {
        id: 'property2',
        name: 'Property 2',
        type: 'select',
        options: [
            {
                id: 'value2',
                value: 'value 2',
                color: 'propColorBlue',
            },
        ],
    },
]
const activeView = TestBlockFactory.createBoardView(board)
activeView.id = 'view1'
activeView.fields.hiddenOptionIds = []
activeView.fields.visiblePropertyIds = ['property1']
activeView.fields.visibleOptionIds = ['value1']
const fakeBoard = {id: board.id}
activeView.boardId = fakeBoard.id
const card1 = TestBlockFactory.createCard(board)
card1.id = 'card1'
card1.title = 'card-1'
card1.boardId = fakeBoard.id
const card2 = TestBlockFactory.createCard(board)
card2.id = 'card2'
card2.title = 'card-2'
card2.boardId = fakeBoard.id
const card3 = TestBlockFactory.createCard(board)
card3.id = 'card3'
card3.title = 'card-3'
card3.boardId = fakeBoard.id

const me: IUser = {id: 'user-id-1', username: 'username_1', email: '', props: {}, create_at: 0, update_at: 0, is_bot: false}

const categoryAttribute1 = TestBlockFactory.createCategoryBlocks()
categoryAttribute1.name = 'Category 1'
categoryAttribute1.blockIDs = [board.id]

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {
                params: {
                    boardId: board.id,
                    viewId: activeView.id,
                },
            }
        }),
    }
})

describe('src/components/workspace', () => {
    const state = {
        teams: {
            current: {id: 'team-id', title: 'Test Team'},
        },
        users: {
            me,
            boardUsers: [me],
            blockSubscriptions: [],
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            templates: [],
            myBoardMemberships: {
                [board.id]: {userId: 'user_id_1', schemeAdmin: true},
            },
        },
        globalTemplates: {
            value: [],
        },
        views: {
            views: {
                [activeView.id]: activeView,
            },
            current: activeView.id,
        },
        cards: {
            templates: [],
            cards: [card1, card2, card3],
        },
        searchText: {},
        clientConfig: {
            value: {
                telemetry: true,
                telemetryid: 'telemetry',
                enablePublicSharedBoards: true,
                featureFlags: {},
            },
        },
        contents: {
            contents: {},
        },
        comments: {
            comments: {},
        },
        sidebar: {
            categoryAttributes: [
                categoryAttribute1,
            ],
        },
    }
    const store = mockStateStore([thunk], state)
    beforeAll(() => {
        mockDOM()
        mockMatchMedia({matches: true})
    })
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUtils.createGuid.mockReturnValue('test-id')
    })
    test('should match snapshot', async () => {
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
        })
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot with readonly', async () => {
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={true}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
        })
        expect(container).toMatchSnapshot()
    })

    test('return workspace and showcard', async () => {
        let container:Element | undefined
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
            const cardElements = container!.querySelectorAll('.KanbanCard')
            expect(cardElements).toBeDefined()
            const cardElement = cardElements[0]
            userEvent.click(cardElement)
        })
        expect(container).toMatchSnapshot()
    })

    test('return workspace readonly and showcard', async () => {
        let container:Element | undefined
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <Workspace readonly={true}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
            const cardElements = container!.querySelectorAll('.KanbanCard')
            expect(cardElements).toBeDefined()
            const cardElement = cardElements[0]
            userEvent.click(cardElement)
        })
        expect(container).toMatchSnapshot()
        expect(mockedUtils.getReadToken).toBeCalledTimes(1)
    })

    test('return workspace with BoardTemplateSelector component', async () => {
        const emptyStore = mockStateStore([], {
            users: {
                me,
                boardUsers: [me],
            },
            teams: {
                current: {id: 'team-id', title: 'Test Team'},
            },
            boards: {
                current: board.id,
                boards: {
                    [board.id]: board,
                },
                templates: [],
                myBoardMemberships: {
                    [board.id]: {userId: 'user_id_1', schemeAdmin: true},
                },
            },
            views: {
                views: {},
            },
            cards: {
                cards: [],
            },
            globalTemplates: {
                value: [],
            },
            searchText: {},
            clientConfig: {
                value: {
                    telemetry: true,
                    telemetryid: 'telemetry',
                    enablePublicSharedBoards: true,
                    featureFlags: {},
                },
            },
        })
        let container:Element | undefined
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ReduxProvider store={emptyStore}>
                    <Workspace readonly={true}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            container = result.container
            jest.runOnlyPendingTimers()
        })

        expect(container).toMatchSnapshot()
    })

    test('show open card tooltip', async () => {
        mockedUtils.isFocalboardPlugin.mockReturnValue(true)

        const welcomeBoard = TestBlockFactory.createBoard()
        welcomeBoard.title = 'Welcome to Boards!'

        const onboardingCard = TestBlockFactory.createCard(welcomeBoard)
        onboardingCard.id = 'card1'
        onboardingCard.title = 'Create a new card'
        onboardingCard.boardId = welcomeBoard.id

        const localState = {
            teams: {
                current: {id: 'team-id', title: 'Test Team'},
            },
            users: {
                me: {
                    id: 'user-id-1',
                    username: 'username_1',
                    email: '',
                    props: {
                        focalboard_welcomePageViewed: '1',
                        focalboard_onboardingTourStarted: true,
                        focalboard_tourCategory: 'onboarding',
                        focalboard_onboardingTourStep: '0',
                    },
                    create_at: 0,
                    update_at: 0,
                    is_bot: false,
                },
                boardUsers: [me],
                blockSubscriptions: [],
            },
            boards: {
                current: welcomeBoard.id,
                boards: {
                    [welcomeBoard.id]: welcomeBoard,
                },
                templates: [],
                myBoardMemberships: {
                    [welcomeBoard.id]: {userId: 'user_id_1', schemeAdmin: true},
                },
            },
            globalTemplates: {
                value: [],
            },
            views: {
                views: {
                    [activeView.id]: activeView,
                },
                current: activeView.id,
            },
            cards: {
                templates: [],
                cards: [onboardingCard, card1, card2, card3],
            },
            searchText: {},
            clientConfig: {
                value: {
                    telemetry: true,
                    telemetryid: 'telemetry',
                    enablePublicSharedBoards: true,
                    featureFlags: {},
                },
            },
            contents: {
                contents: {},
            },
            comments: {
                comments: {},
            },
            sidebar: {
                categoryAttributes: [
                    categoryAttribute1,
                ],
            },
        }
        const localStore = mockStateStore([thunk], localState)

        await act(async () => {
            render(wrapDNDIntl(
                <ReduxProvider store={localStore}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            jest.runOnlyPendingTimers()
        })

        const elements = document.querySelectorAll('.OpenCardTourStep')
        expect(elements.length).toBe(2)
        expect(elements[1]).toMatchSnapshot()
    })

    test('show add new view tooltip', async () => {
        const welcomeBoard = TestBlockFactory.createBoard()
        welcomeBoard.title = 'Welcome to Boards!'

        const onboardingCard = TestBlockFactory.createCard(welcomeBoard)
        onboardingCard.id = 'card1'
        onboardingCard.title = 'Create a new card'
        onboardingCard.boardId = welcomeBoard.id

        const localState = {
            teams: {
                current: {id: 'team-id', title: 'Test Team'},
            },
            users: {
                me: {
                    id: 'user-id-1',
                    username: 'username_1',
                    email: '',
                    props: {
                        focalboard_welcomePageViewed: '1',
                        focalboard_onboardingTourStarted: true,
                        focalboard_tourCategory: 'board',
                        focalboard_onboardingTourStep: '0',
                    },
                    create_at: 0,
                    update_at: 0,
                    is_bot: false,
                },
                boardUsers: [me],
                blockSubscriptions: [],
            },
            boards: {
                current: welcomeBoard.id,
                boards: {
                    [welcomeBoard.id]: welcomeBoard,
                },
                templates: [],
                myBoardMemberships: {
                    [welcomeBoard.id]: {userId: 'user_id_1', schemeAdmin: true},
                },
            },
            globalTemplates: {
                value: [],
            },
            views: {
                views: {
                    [activeView.id]: activeView,
                },
                current: activeView.id,
            },
            cards: {
                templates: [],
                cards: [onboardingCard, card1, card2, card3],
            },
            searchText: {},
            clientConfig: {
                value: {
                    telemetry: true,
                    telemetryid: 'telemetry',
                    enablePublicSharedBoards: true,
                    featureFlags: {},
                },
            },
            contents: {
                contents: {},
            },
            comments: {
                comments: {},
            },
            sidebar: {
                categoryAttributes: [
                    categoryAttribute1,
                ],
            },
        }
        const localStore = mockStateStore([thunk], localState)

        await act(async () => {
            render(wrapDNDIntl(
                <ReduxProvider store={localStore}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            jest.runOnlyPendingTimers()
        })

        await waitFor(() => {
            const elements = document.querySelectorAll('.AddViewTourStep')
            expect(elements).toBeDefined()
            expect(elements.length).toBe(2)
            expect(elements[1]).toMatchSnapshot()
        })
    })

    test('show copy link tooltip', async () => {
        mockedUtils.isFocalboardPlugin.mockReturnValue(true)

        const welcomeBoard = TestBlockFactory.createBoard()
        welcomeBoard.title = 'Welcome to Boards!'

        const onboardingCard = TestBlockFactory.createCard(welcomeBoard)
        onboardingCard.id = 'card1'
        onboardingCard.title = 'Create a new card'
        onboardingCard.boardId = welcomeBoard.id

        const localState = {
            teams: {
                current: {id: 'team-id', title: 'Test Team'},
            },
            users: {
                me: {
                    id: 'user-id-1',
                    username: 'username_1',
                    email: '',
                    props: {
                        focalboard_welcomePageViewed: '1',
                        focalboard_onboardingTourStarted: true,
                        focalboard_tourCategory: 'board',
                        focalboard_onboardingTourStep: '1',
                    },
                    create_at: 0,
                    update_at: 0,
                    is_bot: false,
                },
                boardUsers: [me],
                blockSubscriptions: [],
            },
            boards: {
                current: welcomeBoard.id,
                boards: {
                    [welcomeBoard.id]: welcomeBoard,
                },
                templates: [],
                myBoardMemberships: {
                    [welcomeBoard.id]: {userId: 'user_id_1', schemeAdmin: true},
                },
            },
            globalTemplates: {
                value: [],
            },
            views: {
                views: {
                    [activeView.id]: activeView,
                },
                current: activeView.id,
            },
            cards: {
                templates: [],
                cards: [onboardingCard, card1, card2, card3],
            },
            searchText: {},
            clientConfig: {
                value: {
                    telemetry: true,
                    telemetryid: 'telemetry',
                    enablePublicSharedBoards: true,
                    featureFlags: {},
                },
            },
            contents: {
                contents: {},
            },
            comments: {
                comments: {},
            },
            sidebar: {
                categoryAttributes: [
                    categoryAttribute1,
                ],
            },
        }
        const localStore = mockStateStore([thunk], localState)

        await act(async () => {
            render(wrapDNDIntl(
                <ReduxProvider store={localStore}>
                    <Workspace readonly={false}/>
                </ReduxProvider>,
            ), {wrapper: MemoryRouter})
            jest.runOnlyPendingTimers()
        })

        const elements = document.querySelectorAll('.CopyLinkTourStep')
        expect(elements).toBeDefined()
        expect(elements.length).toBe(2)
        expect(elements[1]).toMatchSnapshot()
    })
})
