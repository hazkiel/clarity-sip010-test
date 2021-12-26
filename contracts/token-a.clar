
;; token-a
;; Definition of a new fungible token called Token A (TOK-A)

;; implements the SIP-010 trait
;; (impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait .sip-010-trait.sip-010-trait)

;; definitions
(define-constant min-fee u1)                                  ;; minimum fee for each TOK-A transaction
(define-constant total-supply u1000000)                       ;; total supply of this new token: 1 million
(define-constant deployer (as-contract tx-sender))
(define-fungible-token token-a total-supply)
(define-data-var rate uint u1000)                             ;; initial rate
(define-data-var rate-update-block uint block-height)         ;; save the block height to prevent more than 1 update in the same block

;; private methods

(define-private (max-of (i1 uint) (i2 uint))
  (if (> i1 i2) i1 i2))

;; public methods

(define-read-only (calculate-fee (amount uint))
  (max-of (/ (* amount u15) u10000) min-fee))

;; get the token balance of owner
(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance token-a owner)))

(define-read-only (get-contract-balance)
  (ok (as-contract (ft-get-balance token-a tx-sender))))

(define-read-only (get-contract-wallet)
  (ok (as-contract tx-sender)))

;; returns the total number of tokens
(define-read-only (get-total-supply)
  ;; (ok total-supply))
  (ok (ft-get-supply token-a)))

;; returns the token name
(define-read-only (get-name)
  (ok "Token A"))

;; the symbol for this token
(define-read-only (get-symbol)
  (ok "TOK-A"))

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u4))

;; transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (if (is-eq tx-sender sender)
      (let ((fee (calculate-fee amount)) (real-amount (- amount fee)))
        (try! (ft-transfer? token-a real-amount sender recipient))
        (try! (if (not (is-eq sender deployer))
          (if (is-ok (ft-transfer? token-a fee sender deployer))
            (ok true)
            (err u5)
          )
          (ok true)
        ))
        (print memo)
        (ok true)
      )
      (err u4)
    )
  )
)

;; get token metadata URI
(define-public (get-token-uri)
  (ok none))

;; buy TOK-A using STX from central stash
(define-public (buy (amount uint) (buyer principal))
  (if (is-eq tx-sender buyer)
    (let ((current-rate (var-get rate)))
      (if (is-ok (stx-transfer? (* current-rate amount) buyer deployer))
        (as-contract (transfer amount tx-sender buyer none))
        (err u11)))
    (err u10)))

;; get the 'TOK-A to STX' rate
(define-public (get-rate)
  (ok (var-get rate)))

;; update the 'TOK-A to STX' rate
(define-public (update-rate (new-rate uint))
  (let ((last-update-block (var-get rate-update-block)))
    (if (> block-height last-update-block)
      (begin
        (var-set rate new-rate)
        (var-set rate-update-block block-height)
        (ok true))
      (err u20))))

;; mint central stash of this token: 10 exp 15
(ft-mint? token-a total-supply deployer)
