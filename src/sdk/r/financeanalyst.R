# FinanceAnalyst Pro R SDK
#
# A comprehensive R package for the FinanceAnalyst Pro platform,
# providing easy access to financial data, analytics, and AI capabilities.
#
# Usage:
#   library(financeanalyst)
#   api <- FinanceAnalystAPI$new(api_key = "your_api_key")
#   quote <- api$get_stock_quote("AAPL")
#   analysis <- api$analyze_portfolio(portfolio_data)

#' API Configuration Class
APIConfig <- R6::R6Class("APIConfig",
  public = list(
    #' @field base_url Base API URL
    base_url = NULL,

    #' @field api_key API authentication key
    api_key = NULL,

    #' @field client_id OAuth client ID
    client_id = NULL,

    #' @field client_secret OAuth client secret
    client_secret = NULL,

    #' @field timeout Request timeout in seconds
    timeout = NULL,

    #' @field max_retries Maximum retry attempts
    max_retries = NULL,

    #' @description Initialize API configuration
    #' @param base_url Base API URL
    #' @param api_key API key
    #' @param client_id OAuth client ID
    #' @param client_secret OAuth client secret
    #' @param timeout Request timeout
    #' @param max_retries Maximum retries
    initialize = function(base_url = "https://api.financeanalystpro.com/v1",
                         api_key = NULL,
                         client_id = NULL,
                         client_secret = NULL,
                         timeout = 30,
                         max_retries = 3) {
      self$base_url <- base_url
      self$api_key <- api_key
      self$client_id <- client_id
      self$client_secret <- client_secret
      self$timeout <- timeout
      self$max_retries <- max_retries
    }
  )
)

#' FinanceAnalyst Pro API Client
FinanceAnalystAPI <- R6::R6Class("FinanceAnalystAPI",
  public = list(
    #' @field config API configuration
    config = NULL,

    #' @field tokens OAuth tokens
    tokens = NULL,

    #' @field last_request_time Time of last request for rate limiting
    last_request_time = NULL,

    #' @description Initialize API client
    #' @param config APIConfig object or list of options
    initialize = function(config = list()) {
      if (inherits(config, "APIConfig")) {
        self$config <- config
      } else {
        self$config <- do.call(APIConfig$new, config)
      }

      self$last_request_time <- Sys.time()
    },

    #' @description Authenticate with username/password
    #' @param username Username
    #' @param password Password
    authenticate = function(username, password) {
      auth_data <- list(
        grant_type = "password",
        username = username,
        password = password,
        client_id = self$config$client_id,
        client_secret = self$config$client_secret
      )

      response <- self$request("POST", "/auth/token", body = auth_data)

      if (response$status_code == 200) {
        self$tokens <- response$content
        message("Authentication successful")
        return(self$tokens)
      } else {
        stop("Authentication failed: ", response$content$message)
      }
    },

    #' @description Refresh access token
    refresh_token = function() {
      if (is.null(self$tokens) || is.null(self$tokens$refresh_token)) {
        stop("No refresh token available")
      }

      refresh_data <- list(
        grant_type = "refresh_token",
        refresh_token = self$tokens$refresh_token,
        client_id = self$config$client_id,
        client_secret = self$config$client_secret
      )

      response <- self$request("POST", "/auth/token", body = refresh_data)

      if (response$status_code == 200) {
        self$tokens <- response$content
        return(self$tokens)
      } else {
        stop("Token refresh failed: ", response$content$message)
      }
    },

    #' @description Make HTTP request with error handling
    #' @param method HTTP method
    #' @param endpoint API endpoint
    #' @param params Query parameters
    #' @param body Request body
    request = function(method, endpoint, params = NULL, body = NULL) {
      # Rate limiting
      self$handle_rate_limiting()

      url <- paste0(self$config$base_url, endpoint)

      headers <- c(
        "User-Agent" = "FinanceAnalystPro-R-SDK/1.0",
        "Content-Type" = "application/json"
      )

      # Add API key
      if (!is.null(self$config$api_key)) {
        headers["X-API-Key"] <- self$config$api_key
      }

      # Add authorization
      if (!is.null(self$tokens) && !is.null(self$tokens$access_token)) {
        headers["Authorization"] <- paste("Bearer", self$tokens$access_token)
      }

      # Prepare request
      args <- list(
        url = url,
        method = method,
        headers = headers,
        timeout = self$config$timeout
      )

      if (!is.null(params)) {
        args$query <- params
      }

      if (!is.null(body)) {
        args$body <- jsonlite::toJSON(body, auto_unbox = TRUE)
      }

      # Make request with retries
      for (attempt in 1:self$config$max_retries) {
        tryCatch({
          response <- httr::VERB(method, url, !!!args)

          # Handle authentication errors
          if (httr::status_code(response) == 401 && !is.null(self$tokens)) {
            tryCatch({
              self$refresh_token()
              # Retry with new token
              headers["Authorization"] <- paste("Bearer", self$tokens$access_token)
              args$headers <- headers
              response <- httr::VERB(method, url, !!!args)
            }, error = function(e) {
              warning("Token refresh failed: ", e$message)
            })
          }

          # Handle rate limiting
          if (httr::status_code(response) == 429) {
            retry_after <- as.numeric(httr::headers(response)$`retry-after`) %||% 60
            message("Rate limited. Waiting ", retry_after, " seconds...")
            Sys.sleep(retry_after)
            next
          }

          # Parse response
          if (httr::status_code(response) >= 200 && httr::status_code(response) < 300) {
            content <- httr::content(response, "parsed", type = "application/json")
            return(list(
              status_code = httr::status_code(response),
              content = content,
              headers = httr::headers(response)
            ))
          } else {
            content <- httr::content(response, "parsed", type = "application/json")
            stop("API request failed: ", content$message %||% "Unknown error")
          }

        }, error = function(e) {
          if (attempt == self$config$max_retries) {
            stop("Request failed after ", self$config$max_retries, " attempts: ", e$message)
          }
          Sys.sleep(2^attempt)  # Exponential backoff
        })
      }
    },

    #' @description Handle rate limiting
    handle_rate_limiting = function() {
      current_time <- Sys.time()
      time_diff <- as.numeric(difftime(current_time, self$last_request_time, units = "secs"))

      # Simple rate limiting: max 10 requests per second
      if (time_diff < 0.1) {
        Sys.sleep(0.1 - time_diff)
      }

      self$last_request_time <- Sys.time()
    }
  ),

  # Market Data Methods
  public = list(
    #' @description Get stock quote
    #' @param symbol Stock symbol
    get_stock_quote = function(symbol) {
      response <- self$request("GET", paste0("/market/quote/", symbol))
      return(response$content)
    },

    #' @description Get historical data
    #' @param symbol Stock symbol
    #' @param period Time period
    #' @param interval Data interval
    get_historical_data = function(symbol, period = "1y", interval = "1d") {
      params <- list(period = period, interval = interval)
      response <- self$request("GET", paste0("/market/history/", symbol), params = params)

      # Convert to data frame
      if (!is.null(response$content$data)) {
        df <- do.call(rbind, lapply(response$content$data, as.data.frame))
        df$timestamp <- as.POSIXct(df$timestamp, origin = "1970-01-01")
        return(df)
      }

      return(response$content)
    },

    #' @description Get company information
    #' @param symbol Stock symbol
    get_company_info = function(symbol) {
      response <- self$request("GET", paste0("/company/", symbol, "/info"))
      return(response$content)
    },

    #' @description Get company financials
    #' @param symbol Stock symbol
    #' @param statement_type Statement type (income, balance, cashflow)
    #' @param period Period (annual, quarterly)
    get_company_financials = function(symbol, statement_type = "income", period = "annual") {
      params <- list(type = statement_type, period = period)
      response <- self$request("GET", paste0("/company/", symbol, "/financials"), params = params)

      # Convert to data frame
      if (!is.null(response$content$data)) {
        return(as.data.frame(response$content$data))
      }

      return(response$content)
    },

    #' @description Get market indices
    get_market_indices = function() {
      response <- self$request("GET", "/market/indices")
      return(response$content)
    }
  ),

  # Analytics Methods
  public = list(
    #' @description Analyze portfolio
    #' @param portfolio Portfolio data
    analyze_portfolio = function(portfolio) {
      response <- self$request("POST", "/analytics/portfolio", body = portfolio)
      return(response$content)
    },

    #' @description Calculate portfolio risk
    #' @param portfolio Portfolio data
    #' @param method Risk calculation method
    #' @param confidence_level Confidence level for VaR
    calculate_risk = function(portfolio, method = "parametric", confidence_level = 0.95) {
      data <- list(
        portfolio = portfolio,
        method = method,
        confidence_level = confidence_level
      )

      response <- self$request("POST", "/analytics/risk", body = data)
      return(response$content)
    },

    #' @description Price options
    #' @param option_params Option parameters
    price_options = function(option_params) {
      response <- self$request("POST", "/analytics/options", body = option_params)
      return(response$content)
    },

    #' @description Analyze derivatives
    #' @param derivatives List of derivatives
    analyze_derivatives = function(derivatives) {
      response <- self$request("POST", "/analytics/derivatives", body = derivatives)
      return(response$content)
    },

    #' @description Perform stress testing
    #' @param portfolio Portfolio data
    #' @param scenarios Stress scenarios
    stress_test_portfolio = function(portfolio, scenarios) {
      data <- list(
        portfolio = portfolio,
        scenarios = scenarios
      )

      response <- self$request("POST", "/analytics/stress-test", body = data)
      return(response$content)
    }
  ),

  # AI/ML Methods
  public = list(
    #' @description Generate AI insights
    #' @param data Financial data
    #' @param context Context information
    generate_insights = function(data, context = NULL) {
      payload <- list(data = data)
      if (!is.null(context)) {
        payload$context <- context
      }

      response <- self$request("POST", "/ai/insights", body = payload)
      return(response$content)
    },

    #' @description Predict financial metrics
    #' @param data Historical data
    #' @param horizon Prediction horizon
    #' @param model ML model type
    predict_metrics = function(data, horizon = 12, model = "auto") {
      payload <- list(
        data = data,
        horizon = horizon,
        model = model
      )

      response <- self$request("POST", "/ai/predict", body = payload)
      return(response$content)
    },

    #' @description Analyze sentiment
    #' @param text Text to analyze
    #' @param source Text source
    analyze_sentiment = function(text, source = "news") {
      payload <- list(
        text = text,
        source = source
      )

      response <- self$request("POST", "/ai/sentiment", body = payload)
      return(response$content)
    }
  ),

  # Utility Methods
  public = list(
    #' @description Get API status
    get_api_status = function() {
      tryCatch({
        response <- self$request("GET", "/health")
        return(response$content)
      }, error = function(e) {
        return(list(
          status = "error",
          message = e$message,
          timestamp = Sys.time()
        ))
      })
    },

    #' @description Get usage statistics
    get_usage_stats = function() {
      response <- self$request("GET", "/usage/stats")
      return(response$content)
    },

    #' @description Create portfolio from data frame
    #' @param df Data frame with symbol and weight columns
    create_portfolio = function(df) {
      assets <- lapply(1:nrow(df), function(i) {
        list(
          symbol = as.character(df$symbol[i]),
          weight = as.numeric(df$weight[i]),
          quantity = as.numeric(df$quantity[i]) %||% 100
        )
      })

      return(list(
        assets = assets,
        created_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ"),
        source = "r_sdk"
      ))
    }
  )
)

# Convenience Functions

#' Quick portfolio analysis
#'
#' @param symbols Vector of stock symbols
#' @param weights Vector of weights (equal weight if NULL)
#' @param api_key API key
#' @export
quick_portfolio_analysis <- function(symbols, weights = NULL, api_key = NULL) {
  if (is.null(weights)) {
    weights <- rep(1 / length(symbols), length(symbols))
  }

  portfolio <- list(
    assets = lapply(1:length(symbols), function(i) {
      list(symbol = symbols[i], weight = weights[i])
    })
  )

  api <- FinanceAnalystAPI$new(list(api_key = api_key))
  return(api$analyze_portfolio(portfolio))
}

#' Batch stock quotes
#'
#' @param symbols Vector of stock symbols
#' @param api_key API key
#' @export
batch_quotes <- function(symbols, api_key = NULL) {
  api <- FinanceAnalystAPI$new(list(api_key = api_key))

  results <- lapply(symbols, function(symbol) {
    tryCatch({
      api$get_stock_quote(symbol)
    }, error = function(e) {
      list(symbol = symbol, error = e$message)
    })
  })

  names(results) <- symbols
  return(results)
}

# Export classes
#' @export
APIConfig

#' @export
FinanceAnalystAPI
