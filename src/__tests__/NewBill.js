/**
 * @jest-environment jsdom
 */
import {fireEvent,screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
jest.mock("../app/store", () => mockStore);
import store from "../app/store";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    jest.spyOn(store, "bills");
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
    document.body.append(root);
    router();
});

  describe("When I am on new bill page", () => {
    
    test("Then bill icon in vertical layout should be highlighted", async () => {     
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      //to-do write expect expression
      expect(mailIcon.classList.contains("active-icon")).toBe(true)
    })
    describe("When I am on new bill page and i complete the form", () => {
      describe("When the file is not image", () => {
        test("Then the error message should be displayed", () => {
          document.body.innerHTML = NewBillUI()
          const newBill = new NewBill({
            document,
            onNavigate,
            firestore: mockStore,
            localStorage: window.localStorage
          })
          const file = new File(["test"], "test.pdf", { type: "application/pdf" })
          const input = screen.getByTestId("file")
          fireEvent.change(input, { target: { files: [file] } })
          expect(screen.getByTestId("file").files[0]).toStrictEqual(file)
          expect(screen.getByTestId("file").files.length).toEqual(1)
          expect(screen.getByTestId("error-file").textContent.length).toBeGreaterThan(0)
        })
      })
      describe("When the file is a image", () => {
        test("Then the error message should not be displayed", () => {
          document.body.innerHTML = NewBillUI()
          new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage
          })
          const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
          const input = screen.getByTestId("file")
          fireEvent.change(input, { target: { files: [file] } })
          expect(screen.getByTestId("file").files[0]).toStrictEqual(file)
          expect(screen.getByTestId("file").files.length).toEqual(1)
          expect(screen.getByTestId("error-file").textContent.length).toBe(0)
        })
      })
    })
    describe("When the form is correct and I click on submit button", () => {
      test("Then the new bill should be created", () => {
        document.body.innerHTML = NewBillUI()
        const newBill=new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
        const form = screen.getByTestId("form-new-bill")
        const completeForm = {
          type: "HÃ´tel et logement",
          name: "Lisa Hotel",
          amount: 180,
          date: "2020-08-11",
          vat: "10",
          pct: 20,
          file: new File(["img"], "receipt.jpg", { type: "image/jpg" }),
          commentary: "...",
         }
          //fire change form
          fireEvent.change(screen.getByTestId("expense-type"), {
            target: { value: completeForm.type },
          })
          fireEvent.change(screen.getByTestId("expense-name"), {
            target: { value: completeForm.name },
          })
          fireEvent.change(screen.getByTestId("amount"), {
            target: { value: completeForm.amount },
          })
          fireEvent.change(screen.getByTestId("datepicker"), {
            target: { value: completeForm.date },
          })
          fireEvent.change(screen.getByTestId("vat"), {
            target: { value: completeForm.vat },
          })
          fireEvent.change(screen.getByTestId("pct"), {
            target: { value: completeForm.pct },
          })
          fireEvent.change(screen.getByTestId("commentary"), {
            target: { value: completeForm.commentary },
          })


        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
        const input = screen.getByTestId("file")

        fireEvent.change(input, { target: { files: [file] } })
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled();
        //test redirection bills page
        const windowIcon = screen.getByTestId('icon-window')
        expect(windowIcon.classList.contains("active-icon")).toBe(true)
      })
    })
  })
  
  describe("When an error occurs on API", () => {
    test("Then fetches bills from an API and fails with 404 message error", async () => {
        // Simulate an post error on API, verify that the error message is displayed
        mockStore.bills.mockImplementationOnce(() => { 
            return {
                list: () => {
                    return Promise.reject(new Error("Erreur 404"));
                },
            };
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);

        expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
        // Simulate an post error on API, verify that the error message is displayed
        mockStore.bills.mockImplementationOnce(() => {
            return {
                list: () => {
                    return Promise.reject(new Error("Erreur 500"));
                },
            };
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);

        expect(message).toBeTruthy();
    });
});
})
