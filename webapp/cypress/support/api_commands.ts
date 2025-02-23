// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Board} from '../../src/blocks/board'
import {UserConfigPatch} from '../../src/user'

Cypress.Commands.add('apiRegisterUser', (data: Cypress.UserData, token?: string, failOnError?: boolean) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/register',
        body: {
            ...data,
            token,
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
        failOnStatusCode: failOnError,
    })
})

Cypress.Commands.add('apiLoginUser', (data: Cypress.LoginData) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/login',
        body: {
            ...data,
            type: 'normal',
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    }).then((response) => {
        expect(response.body).to.have.property('token')
        localStorage.setItem('focalboardSessionId', response.body.token)
    })
})

const headers = () => ({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${localStorage.getItem('focalboardSessionId')}`,
    },
})

Cypress.Commands.add('apiInitServer', () => {
    const data: Cypress.UserData = {
        username: Cypress.env('username'),
        password: Cypress.env('password'),
        email: Cypress.env('email'),
    }
    return cy.apiRegisterUser(data, '', false).apiLoginUser(data)
})

Cypress.Commands.add('apiDeleteBlock', (id: string) => {
    return cy.request({
        method: 'DELETE',
        url: `/api/v1/workspaces/0/blocks/${encodeURIComponent(id)}`,
        ...headers(),
    })
})

const deleteBlocks = (ids: string[]) => {
    if (ids.length === 0) {
        return
    }
    const [id, ...other] = ids
    cy.apiDeleteBlock(id).then(() => deleteBlocks(other))
}

Cypress.Commands.add('apiResetBoards', () => {
    return cy.request({
        method: 'GET',
        url: '/api/v1/workspaces/0/blocks?type=board',
        ...headers(),
    }).then((response) => {
        if (Array.isArray(response.body)) {
            const boards = response.body as Board[]
            const toDelete = boards.filter((b) => !b.isTemplate).map((b) => b.id)
            deleteBlocks(toDelete)
        }
    })
})

Cypress.Commands.add('apiSkipTour', (userID: string) => {
    const body: UserConfigPatch = {
        updatedFields: {
            focalboard_welcomePageViewed: '1',
        },
    }

    return cy.request({
        method: 'PUT',
        url: `/api/v1/users/${encodeURIComponent(userID)}/config`,
        ...headers(),
        body,
    })
})

Cypress.Commands.add('apiGetMe', () => {
    return cy.request({
        method: 'GET',
        url: '/api/v1/users/me',
        ...headers(),
    }).then((response) => response.body.id)
})

Cypress.Commands.add('apiChangePassword', (userId: string, oldPassword: string, newPassword: string) => {
    const body = {oldPassword, newPassword}
    return cy.request({
        method: 'POST',
        url: `/api/v1/users/${encodeURIComponent(userId)}/changepassword`,
        ...headers(),
        body,
    })
})

Cypress.Commands.add('uiCreateNewBoard', (title?: string) => {
    cy.log('**Create new empty board**')
    cy.findByText('+ Add board').click()
    cy.get('.empty-board').first().click({force: true})
    cy.findByPlaceholderText('Untitled board').should('exist')
    cy.wait(10)
    if (title) {
        cy.log('**Rename board**')
        cy.findByPlaceholderText('Untitled board').type(`${title}{enter}`)
        cy.findByRole('textbox', {name: title}).should('exist')
    }
    cy.wait(500)
})

Cypress.Commands.add('uiAddNewGroup', (name?: string) => {
    cy.log('**Add a new group**')
    cy.findByRole('button', {name: '+ Add a group'}).click()
    cy.findByRole('textbox', {name: 'New group'}).should('exist')

    if (name) {
        cy.log('**Rename group**')
        cy.findByRole('textbox', {name: 'New group'}).type(`{selectall}${name}{enter}`)
        cy.findByRole('textbox', {name}).should('exist')
    }
    cy.wait(500)
})

Cypress.Commands.add('uiAddNewCard', (title?: string, columnIndex?: number) => {
    cy.log('**Add a new card**')
    cy.findByRole('button', {name: '+ New'}).eq(columnIndex || 0).click()
    cy.findByRole('dialog').should('exist')

    if (title) {
        cy.log('**Change card title**')
        cy.findByPlaceholderText('Untitled').type(title)
    }
})
