/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { fireEvent } from "@testing-library/dom";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);
describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    //simule le localstorage pour un utilisateur employé
    Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
    });
    window.localStorage.setItem(
        "user",
        JSON.stringify({
            type: "Employee",
        })
    );
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
  })
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {     
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("when I am on the bills page and I click on new bills", () => {
    test("Then the new page appears (newbill)", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = BillsUI({ data: bills })
      const firestore = null
      const bill = new Bills({ document, onNavigate, firestore, localStorage: window.localStorage })      
      const handleClickNewBill = jest.fn(bill.handleClickNewBill)
      const newBillBtn = screen.getByTestId('btn-new-bill')
      newBillBtn.addEventListener('click', handleClickNewBill)
      fireEvent.click(newBillBtn)
      expect(handleClickNewBill).toHaveBeenCalled()

    })

  })
  describe("when I am on the bills page and I click on the image button", () => {
    test("Then the modal opens well", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = BillsUI({ data: bills })
      const firestore = null
      const bill = new Bills({ document, onNavigate, firestore, localStorage: window.localStorage })  
      jQuery.fn.modal = jest.fn()
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(bill.handleClickIconEye(iconEye))      
      iconEye.addEventListener('click', handleClickIconEye)
      fireEvent.click(iconEye)
      expect(handleClickIconEye).toHaveBeenCalled()

    })

  })

 
  describe("When I navigate to bills page", () => {
    // for employee connected
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
      });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
              type: "Employee",
              email: "employee@test.tld",
          })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
   })
    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))      
      expect(document.querySelectorAll(".table tbody tr").length).toEqual(4)
    })
    describe("When an error occurs on API", () => {
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })

  })

})
